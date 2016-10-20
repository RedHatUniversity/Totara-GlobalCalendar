import React from 'react';
import {fillIntArray} from '../../../../shared/utils/Toolbox';

class Pagination extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    let prev    = this.props.prev ? (
          <a href="#"><i className="fa fa-step-backward"/></a>) : (
          <span className="disabled"><i className="fa fa-step-backward"/></span>),
        next    = this.props.next ? (
          <a href="#"><i className="fa fa-step-forward"/></a>) : (
          <span className="disabled"><i
            className="fa fa-step-forward"/></span>),
        numbers = fillIntArray(this.props.start, this.props.end);

    return (<div className="rh-pagination">
      <ul>
        <li>{prev}</li>
        {
          numbers.map((n) => {
            return (n === this.props.current ?
              (<li><span className="active">{n}</span></li>) :
              (<li><a href="#">{n}</a></li>))
          })
        }
        {/*<li><a href="#">1</a></li>*/}
        {/*<li><span className="active">2</span></li>*/}
        {/*<li><a href="#">3</a></li>*/}
        <li>{next}</li>
      </ul>
    </div>);
  }

}

Pagination.defaultProps = {
  prev   : false,
  next   : true,
  start  : 1,
  end    : 5,
  current: 1
};
Pagination.propTypes    = {
  prev   : React.PropTypes.bool,
  next   : React.PropTypes.bool,
  start  : React.PropTypes.number,
  end    : React.PropTypes.number,
  current: React.PropTypes.number
};

export default Pagination;