/*eslint no-undef: "error"*/
/*eslint-env node*/

let {createLMSQuery} = require('../shared');

/**
 * Retrieves user profile from the Moodle core_user_get_users web service.
 * It's recommended to use username/kerberos ID as the search criteria
 *
 * @param wsConfig {urlStem, token}
 * @param field System field to query, username is recommended
 * @param value Value of the field to match
 * @returns {Task}
 */

module.exports.requestCohortMembers = (wsOptions, id) =>
  createLMSQuery(wsOptions, 'core_cohort_get_cohort_members', {
    'cohortids[0]'  : id
  });