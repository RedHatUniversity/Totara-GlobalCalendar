import React from 'react';
import {request} from '../utils/Rest';
import ClassCalendar from '../components/TWS-ClassCalendar';
import {
  ConfigLoadingMessage,
  ConfigLoadingErrorMessage
} from '../components/ConfigLoading';

class ApplicationContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      loading      : true,  // Loading the config.json file
      isError      : false, // Error loading the file?
      config       : {},    // Objects from config.json
      configFileURL: 'config.json'  // null || location of the configuration file
    };
  }

  // On initial mounting of the component, load config or start app
  componentDidMount() {
    this.validateConfiguration();
  }

  // Start the app or load the configuration file
  validateConfiguration() {
    if (!this.state.configFileURL) {
      this.setState({loading: false});
    } else {
      request({
        json: true,
        url : this.state.configFileURL
      }).then((data)=> {
        console.log('Configuration loaded');
        this.setState({loading: false, config: data});
      }).catch((err)=> {
        console.warn('Error loading configuration', err);
        this.setState({loading: false, isError: false, config: {}});
      });
    }
  }

  // Render loading, error or the app via routes
  render() {
    if (this.state.loading) {
      return <ConfigLoadingMessage/>;
    } else if (this.state.isError) {
      return <ConfigLoadingErrorMessage/>;
    }

    return (<div className="rh-padded">
      <ClassCalendar config={this.state.config}/>
    </div>);
  }
}

export default ApplicationContainer