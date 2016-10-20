import React from 'react';

class UtilityBar extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

  render() {
    let links = this.renderLinks();

    return (<div className="rh-utilitybar">
      <p>{this.props.label}</p>
      {this.renderLinks()}
    </div>);
  }

  renderLinks() {
    if(!this.props.links) {
      return (<div>No links</div>)
    }

    return (<ul className="links">
      {
        this.props.links.map((item, i) => {
          return (<li key={i}><a href={item.route} target='_blank'>{item.label}</a></li>);
        })
      }
    </ul>)
  }

}

UtilityBar.defaultProps = {};
UtilityBar.propTypes = {
  label: React.PropTypes.string,
  links: React.PropTypes.array
};

export default UtilityBar;