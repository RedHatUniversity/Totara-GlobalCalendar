/*eslint no-undef: "error"*/
/*eslint-env node*/

let {createLMSQuery} = require('../shared');

/**
 * Retrieves a list of categories from the Moodle core_course_get_categories web
 * service
 *
 * @param wsConfig {urlStem, token}
 * @returns {Task}
 */
module.exports.requestCategories = wsOptions => createLMSQuery(wsOptions, 'core_course_get_categories');

