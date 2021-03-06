import {
  S1GRD,
  S2L1C,
  S2L2A,
  S3OLCI,
  S3SLSTR,
  S5PL2,
  MODIS,
  DEM,
  L8L1C,
  isEmpty,
  CUSTOM,
  DATAFUSION,
} from './const';
import { generateSHBbox } from './generateShjsRequest';
import { transformGeometryToNewCrs } from './crsTransform';
import { getLocationByDatasource } from './generateRequest';

const formatToSHPY = {
  'image/jpeg': 'MimeType.JPG',
  'image/png': 'MimeType.PNG',
  'image/tiff': 'MimeType.TIFF',
};

const getSHPYImports = () => {
  return `import matplotlib.pyplot as plt \n
from sentinelhub import SentinelHubRequest, SentinelHubDownloadClient, DataSource, \
MimeType, DownloadRequest, CRS, BBox, SHConfig, Geometry\n`;
};

const getSHPYS1Datasource = (reqState) => {
  const isDefault = (option) => {
    return Boolean(!option || option === 'DEFAULT');
  };

  //Sh-py options.
  let possibleOptions = [
    'SENTINEL1_EW',
    'SENTINEL1_EW_ASC',
    'SENTINEL1_EW_DES',
    'SENTINEL1_EW_SH',
    'SENTINEL1_EW_SH_ASC',
    'SENTINEL1_EW_SH_DES',
    'SENTINEL1_IW',
    'SENTINEL1_IW_ASC',
    'SENTINEL1_IW_DES',
  ];

  const dataFilterOptions = reqState.dataFilterOptions[0].options;
  const { acquisitionMode, polarization, orbitDirection } = dataFilterOptions;
  // Default
  if (isDefault(acquisitionMode) && isDefault(polarization) && isDefault(orbitDirection)) {
    return 'SENTINEL1_IW';
  }
  if (orbitDirection === 'ASCENDING' || isDefault(orbitDirection)) {
    possibleOptions = possibleOptions.filter((opt) => opt.includes('ASC'));
  }
  if (orbitDirection === 'DESCENDING') {
    possibleOptions = possibleOptions.filter((opt) => opt.includes('DES'));
  }
  if (acquisitionMode === 'IW' || isDefault(acquisitionMode)) {
    possibleOptions = possibleOptions.filter((opt) => opt.includes('IW'));
  }
  if (acquisitionMode === 'EW') {
    possibleOptions = possibleOptions.filter((opt) => opt.includes('EW'));
  }
  if (polarization === 'SH') {
    possibleOptions = possibleOptions.filter((opt) => opt.includes('SH'));
  }
  return possibleOptions.length > 0 ? possibleOptions[0] : 'SENTINEL1_IW';
};

const datasourceToSHPYDatasource = (datasource, requestState) => {
  switch (datasource) {
    case S1GRD:
      return `DataSource.${getSHPYS1Datasource(requestState)}`;
    case S2L2A:
      return 'DataSource.SENTINEL2_L2A';
    case S2L1C:
      return 'DataSource.SENTINEL2_L1C';
    case S3OLCI:
    case S3SLSTR:
      return 'DataSource.SENTINEL3';
    case MODIS:
      return 'DataSource.MODIS';
    case DEM:
      return 'DataSource.DEM';
    case L8L1C:
      return 'DataSource.LANDSAT8_L1C';
    case S5PL2:
      return 'DataSource.SENTINEL5P';
    case CUSTOM:
      return `DataSource('${
        requestState.dataFilterOptions[0].options.collectionId
          ? requestState.dataFilterOptions[0].options.collectionId
          : ''
      }')`;
    default:
      return '';
  }
};

const getDimensionsSHPY = (requestState) => {
  if (requestState.heightOrRes === 'HEIGHT') {
    return `size=[${requestState.width}, ${requestState.height}],`;
  } else {
    return `resolution=(${requestState.width}, ${requestState.height}),`;
  }
};

const crsToSHPYCrs = {
  'EPSG:4326': 'CRS.WGS84',
  'EPSG:3857': 'CRS.POP_WEB',
};

const getSHPYCredentials = () => {
  return `
#Credentials

CLIENT_ID = '<your client id here>'
CLIENT_SECRET = '<your client secret here>'
config = SHConfig()

if CLIENT_ID and CLIENT_SECRET:
  config.sh_client_id = CLIENT_ID
  config.sh_client_secret = CLIENT_SECRET
else:
  config = None
`;
};

const getSHPYBounds = (reqState) => {
  let boundsString = '';
  const bbox = generateSHBbox(reqState.geometry, reqState.CRS);

  boundsString += `bbox = BBox(bbox=[${bbox}], crs=${crsToSHPYCrs[reqState.CRS]})\n`;

  if (reqState.geometry.type === 'Polygon') {
    const transformedGeo = transformGeometryToNewCrs(reqState.geometry, reqState.CRS);
    boundsString += `geometry = Geometry(geometry=${JSON.stringify(transformedGeo)}, crs=${
      crsToSHPYCrs[reqState.CRS]
    })\n`;
  }
  return boundsString;
};

const generateSHPYInputs = (reqState) => {
  // Datafusion
  if (reqState.datasource === 'DATAFUSION') {
    let datafusionString = '';
    reqState.datafusionSources.forEach((source, idx) => {
      datafusionString += `SentinelHubRequest.input_data(
      data_source=${datasourceToSHPYDatasource(source.datasource, reqState)},
      ${getSHPYTimerange(reqState, idx)}\
        ${getSHPYAdvancedOptions(reqState, idx)}
    ),\n    `;
    });
    return datafusionString;
  }

  // No datafusion
  return `SentinelHubRequest.input_data(
    data_source=${datasourceToSHPYDatasource(reqState.datasource, reqState)},
    ${getSHPYTimerange(reqState)}\
    ${getSHPYAdvancedOptions(reqState)}
)`;
};

const getSHPYTimerange = (reqState, idx = 0) => {
  if (reqState.isTimeRangeDisabled) {
    return '';
  }
  let timeFrom = reqState.timeFrom[idx] ? reqState.timeFrom[idx] : reqState.timeFrom[0];
  let timeTo = reqState.timeTo[idx] ? reqState.timeTo[idx] : reqState.timeTo[0];
  return `time_interval=('${timeFrom.split('T')[0]}', '${timeTo.split('T')[0]}'),`;
};

const getSHPYAdvancedOptions = (reqState, idx = 0) => {
  const initialDataFilterOptions = reqState.dataFilterOptions[idx].options;
  const initialProcessingOptions = reqState.processingOptions[idx].options;
  const dataFilterOptions = {};
  const processing = {};
  // Iterate through the options and add non default to datafilterOptions/processing
  if (!isEmpty(initialDataFilterOptions)) {
    Object.keys(initialDataFilterOptions).forEach((key) => {
      let value = initialDataFilterOptions[key];
      if (value !== 'DEFAULT' && key !== 'collectionId') {
        dataFilterOptions[key] = value;
      }
    });
  }

  if (!isEmpty(initialProcessingOptions)) {
    Object.keys(initialProcessingOptions).forEach((key) => {
      let value = initialProcessingOptions[key];
      if (value !== 'DEFAULT') {
        processing[key] = value;
      }
    });
  }

  //If S1, delete acqMode, polarization and orbitDir since they're specified via Datasource.
  if (reqState.datasource === 'S1GRD') {
    delete dataFilterOptions['acquisitionMode'];
    delete dataFilterOptions['polarization'];
    delete dataFilterOptions['orbitDirection'];
  }

  const dataFilterIsEmpty = isEmpty(dataFilterOptions);
  const processingIsEmpty = isEmpty(processing);

  let resultObject = {};
  if (!dataFilterIsEmpty) {
    resultObject.dataFilter = dataFilterOptions;
  }
  if (!processingIsEmpty) {
    resultObject.processing = processing;
  }

  // If datafusion, add location, and id to other args.
  if (reqState.datasource === DATAFUSION) {
    resultObject.id = reqState.datafusionSources[idx].id;
    resultObject.location = getLocationByDatasource(reqState.datafusionSources[idx].datasource);
  }

  let resultString =
    !dataFilterIsEmpty || !processingIsEmpty ? `\n      other_args = ${JSON.stringify(resultObject)}` : '';

  return resultString;
};

const getSHPYResponses = (reqState) => {
  let responsesString = '';
  reqState.responses.forEach((resp) => {
    responsesString =
      responsesString +
      `SentinelHubRequest.output_response('${resp.identifier}', ${formatToSHPY[resp.format]}),\n    `;
  });
  return responsesString;
};

export const getSHPYCode = (requestState) => {
  //add imports
  let shpyCode = `${getSHPYImports()}`;
  //Credentials
  shpyCode += getSHPYCredentials();
  // add evalscript
  shpyCode += `\nevalscript = """\n${requestState.evalscript}\n"""\n`;
  //add geometry/bounds
  shpyCode += getSHPYBounds(requestState);

  shpyCode += `\nrequest = SentinelHubRequest(
  evalscript=evalscript,
  input_data=[
    ${generateSHPYInputs(requestState)}
  ],
  responses=[
    ${getSHPYResponses(requestState)}
  ],
  bbox=bbox,\
  ${requestState.geometry.type === 'Polygon' ? '\n  geometry=geometry,' : ''}
  ${getDimensionsSHPY(requestState)}
  config=config
)`;

  shpyCode += `\nresponse = request.get_data() `;
  return shpyCode;
};
