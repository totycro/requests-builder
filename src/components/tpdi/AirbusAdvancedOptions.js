import React, { useEffect } from 'react';
import store, { airbusSlice } from '../../store';
import { connect } from 'react-redux';

const AirbusAdvancedOptions = ({ dataFilterOptions }) => {
  const handleMaxCCChange = (e) => {
    store.dispatch(airbusSlice.actions.setDataFilterOptions({ maxCloudCoverage: parseInt(e.target.value) }));
  };

  const handleProcessingLevelChange = (e) => {
    store.dispatch(airbusSlice.actions.setDataFilterOptions({ processingLevel: e.target.value }));
  };

  const handleMaxSnowChange = (e) => {
    store.dispatch(airbusSlice.actions.setDataFilterOptions({ maxSnowCoverage: parseInt(e.target.value) }));
  };

  const handleMaxIncidenceChange = (e) => {
    store.dispatch(airbusSlice.actions.setDataFilterOptions({ maxIncidenceAngle: parseInt(e.target.value) }));
  };

  // Reset to default advanced options on unmount.
  useEffect(() => {
    return () => {
      store.dispatch(airbusSlice.actions.defaultAdvancedOptions());
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label className="form__label">Cloud Coverage - {dataFilterOptions.maxCloudCoverage} %</label>
      <input
        value={dataFilterOptions.maxCloudCoverage}
        className="form__input form__input--range"
        onChange={handleMaxCCChange}
        type="range"
        min="0"
        max="100"
      />

      <label className="form__label">Processing Level</label>
      <select
        value={dataFilterOptions.processingLevel}
        className="form__input"
        onChange={handleProcessingLevelChange}
      >
        <option value="DEFAULT">Default</option>
        <option value="SENSOR">Sensor</option>
        <option value="ALBUM">Album</option>
      </select>

      <label className="form__label">Snow Coverage - {dataFilterOptions.maxSnowCoverage} %</label>
      <input
        value={dataFilterOptions.maxSnowCoverage}
        className="form__input form__input--range"
        onChange={handleMaxSnowChange}
        type="range"
        min="0"
        max="90"
      />

      <label className="form__label">Incidence Angle - {dataFilterOptions.maxIncidenceAngle} °</label>
      <input
        value={dataFilterOptions.maxIncidenceAngle}
        className="form__input form__input--range"
        onChange={handleMaxIncidenceChange}
        type="range"
        min="0"
        max="90"
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  dataFilterOptions: state.airbus.dataFilterOptions,
});

export default connect(mapStateToProps)(AirbusAdvancedOptions);
