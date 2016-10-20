import React from 'react';
import {Link} from 'react-router';
import IconCircle from './rh-IconCircle';

class CardIcon extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    let buttonArea = (<div></div>),
        iconArea   = this.props.icon ? (<div className="rh-card-header">
          <IconCircle icon={this.props.icon}/>
        </div>) : (<div></div>),
        content = this.props.content ? (<p>{this.props.content}</p>) : (<div></div>),
        style      = 'rh-card rh-card-icon rh-card-' + this.props.style;

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
      {iconArea}
      <h1>{this.props.title}</h1>
      {content}
      {this.props.children}
      {buttonArea}
    </div>);
  }
}

CardIcon.defaultProps = {
  style: 'light',
  cta  : 'Read more'
};

CardIcon.propTypes = {
  style   : React.PropTypes.string,
  icon    : React.PropTypes.string,
  title   : React.PropTypes.string,
  content : React.PropTypes.string,
  cta     : React.PropTypes.string,
  ctaRoute: React.PropTypes.string,
  ctaLink : React.PropTypes.string
};

export default CardIcon;