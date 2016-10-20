import React from 'react';

class PageModule extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  /*
   <div className="rh-page-module-cta">
   <button className="rh-button">Read more</button>
   </div>
   */

  render() {
    let style    = 'rh-page-module rh-page-module-' + this.props.style,
        title    = this.props.title ? (
          <h1 className="rh-page-module-title">{this.props.title}</h1>) : (
          <div></div>),
        headline = this.props.headline ? (
          <h2
            className="rh-page-module-headline">{this.props.headline}</h2>) : (
          <div></div>);

    return (<div className={style}>
      <div className="page-container">
        {title}
        {headline}
        {this.props.children}
      </div>
    </div>);
  }
}

PageModule.defaultProps = {
  style: 'white'
};

PageModule.propTypes = {
  style   : React.PropTypes.string,
  title   : React.PropTypes.string,
  headline: React.PropTypes.string,
  cta     : React.PropTypes.string
};

export default PageModule;