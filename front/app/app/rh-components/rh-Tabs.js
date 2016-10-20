import React from 'react';
import {Link} from 'react-router';

class Tabs extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (<div className="rh-tabs">
      <ul>
        {
          this.props.nav.map((item, i) => {
            return <li key={i} className={item.active === true ? 'active' : ''}>
              <Link to={item.route}>{item.label}</Link></li>
          })
        }
      </ul>
    </div>);
  }
}

Tabs.defaultProps = {};
Tabs.propTypes    = {
  nav: React.PropTypes.array
};

export default Tabs;