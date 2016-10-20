/*eslint no-undef: "error"*/
/*eslint-env node*/

let {getParameterString} = require('./../../../../shared/utils/Toolbox');

const restFormat = 'json';

module.exports.createURL = (wsurl, token, funct) => {
  return wsurl + '?' + getParameterString({
      wstoken           : token,
      wsfunction        : funct,
      moodlewsrestformat: restFormat
    });
};
