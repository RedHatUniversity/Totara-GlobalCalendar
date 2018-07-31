/*eslint no-undef: "error"*/
/*eslint-env node*/

let Task                              = require('data.task'),
    {requestUserProfile}              = require('./GetUserProfile'),
    {requestCourseStatusForUser}      = require('./GetCourseStatusForUser'),
    {requestCourseProfileForUser}     = require('./GetCourseProfileForUser'),
    {requestCalendar}                 = require('./GetCalendar'),
    {chainTasks, formatSecondsToDate} = require('../shared');

/**
 * Retrieves user profile, enrolled courses and their status by combining several
 * web service calls.
 *
 * @param wsOptions {urlStem, token}
 * @param username User name
 * @returns {Task}
 */
module.exports.requestFullUserProfile = (wsOptions, username, reqOptions = {}) => {
  return new Task((reject, resolve) => {
    _requestBaseUserProfile(wsOptions, username, reqOptions).fork(reject,
      baseUser => {

        let enrolledCourseIDs = [],
            enrolledTasks;

        if (baseUser.enrolledCourses) {
          enrolledCourseIDs = baseUser.enrolledCourses.map(crs => crs.id);
          enrolledTasks     = enrolledCourseIDs.map(courseid => requestCourseStatusForUser(wsOptions, courseid, baseUser.id));

          chainTasks(enrolledTasks).fork(reject,
            resStatus => {
              baseUser.enrolledCourses.map((ecrs, i) => ecrs.status = resStatus[i]);
              resolve(baseUser);
            });

        } else {
          baseUser.enrolledCourses = [];
          resolve(baseUser);
        }

      });
  });

};

// Get the user profile, calendar and course profile
const _requestBaseUserProfile = (wsOptions, username, reqOptions) =>
  new Task((reject, resolve) => {
    let queryField = 'username',
        userProfile,
        userID;

    if (username.indexOf('@') > 0) {
      queryField = 'email';
    }

    // Get the user profile in order to get the user ID to get the rest of the info
    requestUserProfile(wsOptions, username, queryField).fork(reject, res => {
      if (!res.length) {
        console.warn('Couldn\'t get user: ' + username);
        reject(null);
        return;
      }

      let tasks = [];

      userProfile = res[0];
      userID      = userProfile.id;
      if (_shouldGetCalendar(reqOptions)) {
        tasks.push(requestCalendar(wsOptions, userID));
      }
      tasks.push(requestCourseProfileForUser(wsOptions, userID));

      chainTasks(tasks).fork(reject,
        resArray => {
          if (resArray.length === 2) {
            userProfile.calendar        = resArray[0];
            userProfile.enrolledCourses = resArray[1][0].enrolledcourses;
          } else {
            userProfile.calendar        = [];
            userProfile.enrolledCourses = resArray[0][0].enrolledcourses;
          }
          resolve(_cleanUserProfile(userProfile));
        });
    });
  });

const _shouldGetCalendar = options => {
  return (options.hasOwnProperty('calendar') && options.calendar === true) || Object.keys(options).length === 0;
};

// Clean up some of the data in the profile object for a better result
const _cleanUserProfile = (profileObject) => {
  let cleaned = Object.assign({}, profileObject);

  cleaned.firstaccess = formatSecondsToDate(profileObject.firstaccess);
  cleaned.lastaccess  = formatSecondsToDate(profileObject.lastaccess);

  cleaned.customfields = profileObject.customfields.reduce((acc, field) => {
    let val = field.value;

    if (field.type === 'datetime') {
      val = formatSecondsToDate(val);
    } else if (field.type === 'checkbox') {
      val = val === '1';
    }

    acc[field.shortname] = val;
    return acc;
  }, {});

  return cleaned;
};