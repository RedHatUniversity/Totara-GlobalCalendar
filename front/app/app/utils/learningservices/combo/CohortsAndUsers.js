let Task                   = require('data.task'),
    {curry, contains}      = require('ramda'),
    {requestCohortMembers} = require('../lms/GetCohortMembers'),
    {requestUserProfile}   = require('../lms/GetUserProfile'),
    {chainTasks}           = require('../shared');

/**
 * Get the user profiles and filters out people who are not in the given cohort ID
 * @param wsOptions
 * @param cohortId
 * @param userArray
 * @param userField
 */
const requestUsersAndFilterForCohort = (wsOptions, cohortId, userArray, userField) =>
  new Task((reject, resolve) => {
    chainTasks([requestCohortMembers(wsOptions, cohortId), requestUserProfile(wsOptions, userArray, userField)])
      .fork(reject, result => {
        let filtered = result[1].filter(userObjInCohort(isInCohort(result[0][0].userids)));
        resolve(filtered);
      });
  });

const userObjInCohort = curry((predicate, userObj) => predicate(userObj.id));

const isInCohort = curry((cohortMembers, id) => {
  return contains(id, cohortMembers);
});

module.exports = {requestUsersAndFilterForCohort};