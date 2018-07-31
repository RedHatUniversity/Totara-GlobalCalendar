/*eslint no-undef: "error"*/
/*eslint-env node*/

let {createLMSQuery} = require('../shared');

/**
 * Creates a new coures in the LMS using the core_course_create_courses web
 * service
 *
 * @param wsConfig {urlStem, token}
 * @param courseProps {fullname, shortname}
 * @returns {Task}
 */

module.exports.createCourse = (wsOptions, courseProps) => {

  // Default values
  let defaults          = {
        categoryid     : 8,
        format         : 'topics',
        coursetype     : 0,
        audiencevisible: 3
      },
      courseParams      = Object.assign(defaults, courseProps),
      finalCourseParams = Object.keys(courseParams).reduce((obj, key) => {
        obj['courses[0][' + key + ']'] = courseParams[key];
        return obj;
      }, {});

  return createLMSQuery(wsOptions, 'core_course_create_courses', finalCourseParams);
};