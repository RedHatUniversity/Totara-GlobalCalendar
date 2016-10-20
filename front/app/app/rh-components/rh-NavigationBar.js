import React from 'react';
import {browserHistory, Link} from 'react-router';

class NavigationBar extends React.Component {

  constructor() {
    super();
    this.state = {currentPath: ''};
  }

  componentDidMount() {
    browserHistory.listen((event) => {
      this.updateCurrentPath(event.pathname);
    })
  }

  updateCurrentPath(newPath) {
    this.setState({currentPath: newPath});
  }

  render() {
    let searchBox = this.props.search ?
      (<div className="navigationbar-search"><input type="text"
                                                    placeholder={this.props.searchPlaceholder}/><button><i className="fa fa-search"/></button>
      </div>) : <div/>;

    return (
      <div className="navigationbar">
        <ul>
          {
            this.props.nav.map((item, i) => {
              return <li key={i}><Link
                className={this.state.currentPath === item.route ? 'active' : ''}
                to={item.route}>{item.label}</Link></li>
            })
          }
        </ul>
        {searchBox}
      </div>
    );
  }
}

NavigationBar.defaultProps = {
  search           : false,
  searchPlaceholder: 'Search'
};

NavigationBar.propTypes = {
  nav              : React.PropTypes.array,
  search           : React.PropTypes.bool,
  searchPlaceholder: React.PropTypes.string
};

export default NavigationBar;