import React from 'react';
import {Link} from 'react-router';
import IconCircle from './rh-IconCircle';

class Card extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    let headerArea = this.props.title ? (<div className="rh-card-header">
          <h1>{this.props.title}</h1>
        </div>) : (<div/>),
        buttonArea = (<div></div>),
        content    = this.props.content ? (<p>{this.props.content}</p>) : (
          <div></div>),
        style      = 'rh-card rh-card-' + this.props.style;

    if (this.props.ctaRoute) {
      buttonArea = (<div className="rh-card-footer">
        <Link to={this.props.ctaRoute} className="cta">{this.props.cta}</Link>
      </div>)
    } else if (this.props.ctaLink) {
      buttonArea = (<div className="rh-card-footer">
        <a href={this.props.ctaLink} className="cta">{this.props.cta}</a>
      </div>)
    }

    return (<div className={style}>
      {headerArea}
      {this.props.children}
      {buttonArea}
    </div>);
  }
}

Card.defaultProps = {
  style: 'light',
  cta  : 'Read more'
};

Card.propTypes = {
  style   : React.PropTypes.string,
  title   : React.PropTypes.string,
  cta     : React.PropTypes.string,
  ctaRoute: React.PropTypes.string,
  ctaLink : React.PropTypes.string
};

export default Card;