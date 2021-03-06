import React, { useState } from 'react';
import store, { tpdiSlice } from '../../store';
import { focusMap } from '../input/MapContainer';

const PlanetFeatureInfo = ({ feature }) => {
  const [expandedInfo, setExpandedInfo] = useState(false);

  const handleParseGeometryToMap = () => {
    store.dispatch(tpdiSlice.actions.setExtraMapGeometry(feature.geometry));
    focusMap();
  };

  const handleAddToOrder = () => {
    store.dispatch(tpdiSlice.actions.addProduct(feature.id));
  };

  return (
    <div className="tpdi-feature">
      <div className="tpdi-feature-title">
        <label onClick={() => setExpandedInfo(!expandedInfo)} className="form__label">
          {feature.id} - {expandedInfo ? String.fromCharCode(0x25b2) : String.fromCharCode(0x25bc)}
        </label>
        <button className="secondary-button" onClick={handleParseGeometryToMap}>
          See on map
        </button>
      </div>
      {expandedInfo ? (
        <div className="tpdi-feature-extra-info u-margin-bottom-tiny">
          <p className="text">
            <span>Acquisition Date: </span>
            {feature.properties.acquired}
          </p>
          <p className="text">
            <span>Cloud Cover: </span>
            {feature.properties.cloud_cover}
          </p>
          <p className="text">
            <span>Snow Cover: </span>
            {feature.properties.snow_ice_percent}
          </p>
          <p className="text">
            <span>Shadow Percent: </span>
            {feature.properties.shadow_percent}
          </p>
          <p className="text">
            <span>Pixel Resolution: </span>
            {feature.properties.pixel_resolution}
          </p>
          <button className="secondary-button" onClick={handleAddToOrder}>
            Add to orders
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PlanetFeatureInfo;
