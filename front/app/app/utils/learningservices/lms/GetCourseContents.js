/*eslint no-undef: "error"*/
/*eslint-env node*/

let {curry} = require('ramda'),
    {isArray} = require('lodash'),
    {createLMSQuery, chainTasks}     = require('../shared');



/**
 * Retrieves extended course information from the Moodle
 * core_course_get_contents web service
 *
 * @param wsConfig {urlStem, token}
 * @param courseid Numeric ID of the course or an array of course IDs
 * @returns {Task}
 */
const requestCourseContents = (wsOptions, courseid) => {
  if(isArray(courseid)) {
    return _requestM(wsOptions, courseid);
  }
  return _requestS (wsOptions, courseid);
}

// Create a reusable function ready for a course ID
const _fetchCourseContents = curry((wsOptions, courseid) => createLMSQuery(wsOptions, 'core_course_get_contents', {'courseid': courseid}, courseid));
const _requestS = (wsOptions, courseid) => _fetchCourseContents(wsOptions)(courseid);
const _requestM = (wsOptions, courseids) => chainTasks(courseids.map(_fetchCourseContents(wsOptions)));

module.exports = {
  requestCourseContents
};