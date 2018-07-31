let {curry, concat}          = require('ramda'),
    Task                     = require('data.task'),
    {requestFullUserProfile} = require('../lms/GetFullUserProfile'),
    {
      createAggregateQuery,
      requestAggregate
    }                        = require('../lrs/LRS'),
    {chainTasks}             = require('../shared');

const requestUsersFromLMSandLRS = (wsConfig, usersArry, onProgressFn = () => {}) =>
  usersArry.length <= 10 ? requestUsersAsync(wsConfig, usersArry, onProgressFn) : requestUsersSeq(wsConfig, usersArry, onProgressFn);

// Request user details all at once
// TODO can i update progress?
const requestUsersAsync = (wsConfig, usersArry, onProgressFn) =>
  chainTasks(_toTaskArray(wsConfig, usersArry));

// Sequentially request user details
// onProgress is called with the # of users left before each new user is queried
const requestUsersSeq = (wsConfig, usersArry, onProgressFn = () => {}) =>
  _sequenceTasks(_toTaskArray(wsConfig, usersArry), onProgressFn);

// Sequentially execute Tasks
// taskArry - array of Tasks to fork
// onProgressFn - called w/ number of tasks remaining
const _sequenceTasks = (taskArry, onProgressFn) =>
  new Task((rej, res) => {
    // Recursively execute tasks
    const next = (tasks, accumulator) => {
      let task = tasks.shift();
      if (task) {
        onProgressFn(tasks.length);
        task.fork(e => {
          // Warn of error but don't bail
          console.warn(e);
          next(tasks, accumulator);
        }, res => {
          next(tasks, concat(accumulator, [res]));
        });
      } else {
        res(accumulator);
      }
    };
    // Start
    next(taskArry, []);
  });

const _toTaskArray = (wsConfig, list) => list.map(_getUser(wsConfig));

const _getUser = curry((wsConfig, email) =>
  chainTasks([requestFullUserProfile(wsConfig, email, {calendar: false}),
    _requestLRSUser(wsConfig, email)])
    .map(_arrangeResults(email)));

const _requestLRSUser = (wsConfig, email) =>
  wsConfig.hasOwnProperty('lrs') ? requestAggregate(wsConfig.lrs, createAggregateQuery({
    ['statement.actor.mbox']: 'mailto:' + email
  })) : Task.of([]);

const _arrangeResults = curry((email, results) => ({
  [email]: {
    lms: results[0], lrs: results[1]
  }
}));

// This is the best way but it's not working - error w/ nested tasks?
//  failing on getcourseprofile core_get_course_status webservice call
//Task.of(_handleResults(username))
//.ap(requestFullUserProfile(wsConfig, username))
//.ap(_requestLRSUser(wsConfig.lrs, username));

module.exports = {requestUsersFromLMSandLRS};