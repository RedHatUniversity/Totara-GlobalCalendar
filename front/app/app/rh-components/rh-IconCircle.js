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

class IconCircle extends React.Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    let iconStyle = 'fa fa-' + this.props.icon;

    return (<div className='rh-icon-circle'>
      <i className={iconStyle}></i>
    </div>);
  }
}

IconCircle.defaultProps = {
  size      : '8rem',
  background: 'rgb(202, 6, 18)',
  foreground: '#fff',
  icon      : 'cog'
};
IconCircle.propTypes    = {
  size      : React.PropTypes.string,
  background: React.PropTypes.string,
  foreground: React.PropTypes.string,
  icon      : React.PropTypes.string
};

export default IconCircle;