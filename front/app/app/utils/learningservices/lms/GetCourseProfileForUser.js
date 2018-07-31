/*eslint no-undef: "error"*/
/*eslint-env node*/


let {createLMSQuery} = require('../shared');

/**
 * Retrieves user profile and enrolled course information from the Moodle
 * core_user_get_course_user_profiles web service.
 * Response includes courses (SCORM and ILT) the user is enrolled in. Courses
 * are in-progress and completed.
 *
 * @param wsConfig {urlStem, token}
 * @param userid Numeric ID of the user
 * @returns {Promise}
 */

module.exports.requestCourseProfileForUser = (wsOptions, userid) =>
  createLMSQuery(wsOptions, 'core_user_get_course_user_profiles', {
    'userlist[0][userid]'  : userid,
    'userlist[0][courseid]': 1 // This needs to be >0 but results seem to be the same for any value
  });
