/*eslint no-undef: "error"*/
/*eslint-env node*/

/**
 * Retrieve user profile from a given field
 **/

let {createLMSQuery} = require('../shared');

/**
 * Retrieves user course completion information from the Moodle
 * core_completion_get_course_completion_status web service.
 * Response includes details for course completion criteria, completed true/false
 * and if the user has viewed the course or not
 *
 * Example full result for not enrolled
 {
   "exception": "moodle_exception",
   "errorcode": "usernotenroled",
   "message": "User is not enrolled in this course"
 }
 *
 * Example for not enrolled
 { exception: 'moodle_exception',
   errorcode: 'usernotenroled',
   message: 'User is not enrolled in this course' }
 *
 * Example completion for SCORM
 {
   "type": 4,
   "title": "Activity completion",
   "status": "No",
   "complete": false,
   "timecompleted": null,
   "details": {
       "type": "Activity completion",
       "criteria": "<a href=\"https://.../mod/scorm/view.php?id=189\">Course Name</a>",
       "requirement": "Viewing the scorm, Passed, Completed",
       "status": "Viewed the scorm"
   }
}
 *
 * Example completion for ILT
 {
    "type": 4,
    "title": "Activity completion",
    "status": "No",
    "complete": false,
    "timecompleted": null,
    "details": {
        "type": "Activity completion",
        "criteria": "<a href=\"https://.../mod/facetoface/view.php?id=1028\">Course Name</a>",
        "requirement": "",
        "status": "Not completed"
    }
  },
 *
 * @param wsConfig {urlStem, token}
 * @param courseid Numeric ID of the course
 * @param userid Numeric ID of the user
 * @returns {Task}
 */

module.exports.requestCourseStatusForUser = (wsOptions, courseid, userid) =>
  createLMSQuery(wsOptions, 'core_completion_get_course_completion_status', {
    'userid'  : userid,
    'courseid': courseid
  });