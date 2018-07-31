/*eslint no-undef: "error"*/
/*eslint-env node*/

let {is}                  = require('ramda'),
    {createLMSQuery} = require('../shared');

/**
 * Retrieves one or more user profiles from the Moodle core_user_get_users_by_field
 * web service.
 *
 * @param wsConfig {urlStem, token}
 * g s@param value Value of the field to match
 * @param field System field to query, username is recommended
 * @returns {Task}
 */

const requestUserProfile = (wsOptions, value, field = 'username') =>
  (is(Number, value) || is(String, value)) ? _requestUserArray(wsOptions, [value], field) : _requestUserArray(wsOptions, value, field);

//const _requestUser = curry((wsOptions, value, field) => createLMSQuery(wsOptions, 'core_user_get_users', {
//  'criteria[0][key]'  : field,
//  'criteria[0][value]': value
//}));

const _requestUserArray = (wsOptions, values, field) => {
  let queryparams = values.reduce((acc, v, idx) => {
    acc[('values[' + idx + ']')] = v;
    return acc;
  }, {field: field});
  return createLMSQuery(wsOptions, 'core_user_get_users_by_field', queryparams);
};


module.exports = {requestUserProfile};