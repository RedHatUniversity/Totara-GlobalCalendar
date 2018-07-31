/*eslint no-undef: "error"*/
/*eslint-env node*/

let {createLMSQuery} = require('../shared');

/**
 * Retrieves a list of cohorts from the LMS
 *
 * Example result:
 { id: 1,
    name: 'All Associates',
    idnumber: 'AUD0001',
    description: 'This audience will be used to identify and group all company associates.',
    descriptionformat: 1,
    visible: true }
 *
 * @param wsConfig {urlStem, token}
 * @returns {Task}
 */
module.exports.requestCohorts = wsOptions => createLMSQuery(wsOptions, 'core_cohort_get_cohorts');

