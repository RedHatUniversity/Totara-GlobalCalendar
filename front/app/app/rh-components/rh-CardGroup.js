import React from 'react';

class CardGroup extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    let orientation = 'rh-card-container-'+this.props.orientation;

    return (<div className={orientation}>{this.props.children}</div>);
  }
}

CardGroup.defaultProps = {
  orientation: 'horizontal'
};

CardGroup.propTypes = {
  orientation: React.PropTypes.string
};

export default CardGroup;