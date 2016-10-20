/*eslint no-undef: "error"*/
/*eslint-env node*/

/**
 * Retrieves a list of course categories,
 **/

let {request}            = require('./Rest'),
    {getParameterString} = require('./../../../../shared/utils/Toolbox'),
    wsURL                = '/webservice/rest/server.php';

module.exports.requestCategories = (wsConfig) => {

  function createWSURL(funct) {
    return wsConfig.urlStem + wsURL + '?' + getParameterString({
        wstoken           : wsConfig.token,
        wsfunction        : funct,
        moodlewsrestformat: 'json'
      });
  }

  return new Promise((resolve, reject) => {
    request({
      json: true,
      url : createWSURL('core_course_get_categories')
    }).then((data)=> {
      resolve(data);
    }).catch((err)=> {
      reject('Error fetching courseCategories', err);
    });
  });
};

