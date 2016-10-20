import React from 'react';

/*
 Disabled, 9/8/16 Aphrodite causing errors
 import {StyleSheet, css} from 'aphrodite';
 styles     = StyleSheet.create({
 icon: {
 width       : '8rem',
 height      : '8rem',
 borderRadius: '4rem',
 background  : '#0f0',
 color       : '#0ff',
 fontSize    : '3.4rem',
 fontWeight  : 300,
 lineHeight  : '8rem',
 textAlign   : 'center'
 }
 });
 */

class IconCircleImage extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    return (<div className='rh-icon-circle-image'>
      <img src={this.props.url} alt={this.props.alt}/>
    </div>);
  }
}

IconCircleImage.defaultProps = {
  size: '8rem',
  alt : 'Circle icon image'
};
IconCircleImage.propTypes    = {
  size: React.PropTypes.string,
  url : React.PropTypes.string,
  alt : React.PropTypes.string
};

export default IconCircleImage;