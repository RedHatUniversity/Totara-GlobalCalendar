/**
 * Simple module to send xAPI statements to an LRS
 * Matt Perkins, mperkins@redhat.com
 * Last Updated, 1/6/17
 *
 * Full doc https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#result
 * TinCan Module docs http://rusticisoftware.github.io/TinCanJS/
 * Statements https://tincanapi.com/statements-101/
 * More https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#parttwo
 * XAPI Wrapper here https://github.com/adlnet/xAPIWrapper/blob/master/src/xapiwrapper.js
 *
 */

let Task                           = require('data.task'),
    Either                         = require('data.either'),
    {curry, compose, concat}       = require('ramda'),
    verbDictionary                 = require('./ADL-Verbs'),
    activityDictionary             = require('./ADL-Activity'),
    {defaults}                     = require('lodash'),
    {createLRSQuery, parameterize} = require('../shared'),
    verbURLPrefix                  = 'http://adlnet.gov/expapi/verbs/',
    activityURLPrefix              = 'http://adlnet.gov/expapi/activities/',
    defaultLanguage                = 'en-US',
    lrsOptions,
    defaultProps                   = {};

// Set connection options
// obj -> endpoint: Str, token: Str, version: Str
// token is the key/secret or user/pass base 64 encoded: 'key:secret' -> base64
const setLRSOptions = (obj) => {
  lrsOptions = obj;
  // Don't want to do this since it'll override these props as part of a later
  // statement
  //setDefaultsFromOptions(lrsOptions);
};

// Set defaults to be applied to each statement
const setStatementDefaults = (defaultObj) => {
  defaultProps = Object.assign(Object.create(null), defaultObj);
};

// Set basic statement props that I've commonly used
/*const setDefaultsFromOptions = (options) => {
  setStatementDefaults({
    result : {
      completion: true
    },
    context: {
      platform         : options.contextID,
      revision         : '1',
      contextActivities: {
        grouping: [{id: options.contextGroup}],
        parent  : [{
          id        : options.contextParent,
          objectType: 'Activity'
        }],
        category: [{
          id        : options.contextCategory,
          definition: {type: 'http://id.tincanapi.com/activitytype/source'}
        }],
        extensions       : {
          ['http://learning.redhat.com/lmsid']: lmsid,
          ['http://learning.redhat.com/oracleid']:oracleid
        }
      }
    }
  });
};*/

const _getDictionaryWordsList = (dictionary) => {
  return Object.keys(dictionary).map((key) => dictionary[key].display[defaultLanguage]);
};

// Returns array of verbs from the ADL list
const getVerbsList = () => {
  return _getDictionaryWordsList(verbDictionary);
};

// True if the verb is on the ADL list
const _validateVerb = (verb) => {
  return getVerbsList().indexOf(verb.toLowerCase()) >= 0;
};

// Returns array of activity from the ADL list
const getActivitiesList = () => {
  return _getDictionaryWordsList(activityDictionary);
};

// True if the activity is on the ADL list
const _validateActivity = (activity) => {
  return getActivitiesList().indexOf(activity.toLowerCase()) >= 0;
};

// Create an xAPI statement object from a partial
const createStatement = (partialStatement) => {
  let statement,
      {
        subjectName,
        subjectID,
        verbDisplay,
        objectID,
        objectType,
        objectName
      } = partialStatement;

  // This check may be used for troubleshooting
  // if (!_validateVerb(verbDisplay)) {
  //   console.log('Verb is not in the dictionary: ' + verbDisplay);
  // }

  statement = defaults({
    actor : {
      name: subjectName,
      mbox: 'mailto:' + subjectID
    },
    verb  : {
      id     : verbURLPrefix + verbDisplay.toLowerCase(),
      display: {'en-US': verbDisplay.toLowerCase()}
    },
    object: {
      id        : objectID,
      definition: {
        type: objectType ? activityURLPrefix + objectType : null,
        name: {'en-US': objectName}
      }
    }
  }, defaultProps);
  return statement;
};

// Send an xAPI statement
// statement may be an array of statements
// ex: sendStatement(opts, createStatement(fragment)).fork(console.warn, log);
const sendStatement = curry((options, statement) => {
  if (options) {
    setLRSOptions(options);
  }

  return Either.fromNullable(options || lrsOptions)
    .fold(
      () => new Task.rejected('sendStatement: Need LRS options'),
      () => createLRSQuery(lrsOptions, 'POST', {}, JSON.stringify(statement))
    );
});

// Send a partial xAPI statement to the LRS. Will first be filled out w/ defaults
const sendFragment = curry((options, fragment) => compose(sendStatement(options), createStatement)(fragment));

// Helper to create an LRS statement query from an email address
const createAgentEmailQuery = email => {
  if (!validateEmail(email)) {
    console.error('createAgentEmailQuery with "' + email + '" is not a valid email address. Request will fail.');
  }

  return ({
    agent: JSON.stringify({
      objectType: 'Agent',
      mbox      : `mailto:${email}`
    })
  });
};

const validateEmail = email => {
  let regex = /.+@.+/;
  return regex.test(email);
};

// Get first 100 statements from the LRS
// Statement may be an individual ID, array or null for all of them
// ex: requestStatements(opts, createAgentEmailQuery('blueberry@pietown.com')).fork(console.warn, log);
const requestStatements = curry((options, query) => {
  if (options) {
    setLRSOptions(options);
  }

  return Either.fromNullable(options || lrsOptions)
    .fold(
      () => new Task.rejected('requestStatements: Need LRS options'),
      () => createLRSQuery(lrsOptions, 'GET', query)
    );
});

// Recursively query for all user statements
const requestAllStatements = curry((options, query) => {
  if (options) {
    setLRSOptions(options);
  }

  return new Task((rej, res) => {

    const makeQuery = (more) => Either.fromNullable(options || lrsOptions)
      .fold(
        () => new Task.rejected('requestAllStatements: Need LRS options'),
        () => {
          return more ? createLRSQuery(lrsOptions, 'GET', more) : createLRSQuery(lrsOptions, 'GET', query);
        }
      );

    // Recursively execute tasks
    const next = (task, accumulator) => {
      task.fork(e => {
        console.error(e);
        rej(e);
      }, statmentRes => {
        if (statmentRes.more) {
          next(makeQuery(statmentRes.more), concat(accumulator, statmentRes.statements));
        } else {
          res(concat(accumulator, statmentRes.statements));
        }
      });
    };

    // Start
    next(makeQuery(null), []);
  });

});

/*
 {
 ['statement.actor.mbox']        : 'mailto:' + email,
 ['statement.context.platform']  : platform,
 ['statement.verb.display.en-US']: verbDisplay,
 ['statement.verb.id']           : verbId,
 ['statement.object.id']         : objectId,
 voided                          : false
 }
 */

// https://docs.mongodb.com/manual/core/aggregation-pipeline/
const createAggregateQuery = (match) => {
  if (!match.hasOwnProperty('voided')) {
    match.voided = false;
  }

  let pipeline = [
    {
      ['$match']: match
    },
    {
      ['$project']: {
        ['_id']  : 0,
        statement: 1
      }
    }
    //{
    //  ['$sort']: {
    //    'statement.timestamp': 1
    //  }
    //}
  ];

  //2017-05-02T18:15:44.138400+00:00

  return '/api/v1/statements/aggregate?pipeline=' + encodeURIComponent(JSON.stringify(pipeline));
};

//http://docs.learninglocker.net/statements_api/#aggregate
/* Results will be:
res => {result: [{statement:{...}, ...]}
Map unwraps this and returns an array of just statements
 */
const requestAggregate = curry((options, query) => {
  if (options) {
    setLRSOptions(options);
  }

  return Either.fromNullable(options || lrsOptions)
    .fold(
      () => new Task.rejected('requestAggregate: Need LRS options'),
      () => createLRSQuery(lrsOptions, 'GET', query).map(res => res.result.reduce((acc, s) => {
        acc.push(s.statement);
        return acc;
      }, []))
    );
});

module.exports = {
  setLRSOptions,
  setStatementDefaults,
  getVerbsList,
  getActivitiesList,
  createStatement,
  sendStatement,
  sendFragment,
  createAgentEmailQuery,
  requestStatements,
  requestAllStatements,
  requestAggregate,
  createAggregateQuery
};