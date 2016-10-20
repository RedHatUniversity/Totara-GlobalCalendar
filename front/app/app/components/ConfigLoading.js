import React from 'react';

/*
 Views for loading config.json
 */

function createWrapper(inner) {
  return (<div className="rh-panel">
    {inner}
  </div>);
}

export const ConfigLoadingMessage = (props) => createWrapper(<h3
  className="rh-app-loading-message">Reticulating
  splines...</h3>);

export const ConfigLoadingErrorMessage = (props) => createWrapper(<h3
  className="rh-app-loading-message-error">Error
  loading the configuration
  file! Check the console.</h3>);