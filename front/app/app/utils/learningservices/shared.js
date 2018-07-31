/*eslint no-undef: "error"*/
/*eslint-env node*/

require('isomorphic-fetch');

let Task                           = require('data.task'),
    Either                         = require('data.either'),
    {sequence, curry, compose, is} = require('ramda');

const WEBSERVICEPATH = '/webservice/rest/server.php';

// For debugging in a compose
const trace = x => {
  console.log('>>> ', x);
  return x;
};

// 1 Just getting an array w/ unique values using a object/keys then getting the keys
const keys               = obj => Object.keys(obj);
// 2
const createObjectKeyMap = curry((key, arry) => arry.reduce((acc, el) => {
  acc[el[key]] = 1;
  return acc;
}, {}));
// 3
const getUniqueKeys      = (key, arry) => compose(keys, createObjectKeyMap(key))(arry);

// eitherToTask :: Either -> Task
const eitherToTask = either => either.fold(Task.rejected, Task.of);

const concatUnique = (x, ys) =>
  Either.fromNullable(ys.filter(y => y === x)[0]).fold(() => ys.concat(x), y => ys);

const dynamicSortObjArry = (property) => (a, b) => a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;

// getDateAsSeconds :: Object -> Number
const dateObjToSeconds = ({year, month, day}) => new Date(year, month, day).valueOf() / 1000;

const formatSecondsToDate = seconds =>
  new Date(parseInt(seconds * 1000)).toLocaleDateString();

const formatSecondsToDateObj = seconds => new Date(parseInt(seconds * 1000));

const getMatchDates = str =>
  str.match(/\s*(?:(?:jan|feb)?r?(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|oct(?:ober)?|(?:sept?|nov|dec)(?:ember)?)\s+\d{1,2}\s*,?\s*\d{4}/ig);

const getMatchTimes = str => str.match(/(\d{1,2})\s*:\s*(\d{2})\s*([ap]m?)/ig);

const hrTo24 = (hr, pm) => {
  hr = parseInt(hr);
  let fhr = (hr === 12 ? 0 : hr) + (pm ? 12 : 0);
  if(fhr < 10) {
    fhr = '0' + fhr;
  }
  return fhr;
};

const formatSecondsToHHMM = seconds => {
  let d = Number(seconds),
      h = Math.floor(d / 3600),
      m = Math.floor(d % 3600 / 60);
  return ((h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m);
};

// Convert one of these 9:00 AM, 5:00 PM to 09:00 or 17:00
const convertTimeStrToHourStr = (str, is24 = true) => {
  let parts = str.toLowerCase().split(' '),
      time  = parts[0].split(':'),
      hr    = is24 ? hrTo24(time[0], (parts[1] === 'pm')) : time[0];
  return [hr, time[1]].join(':');
};

const formatSecDurationToStr = seconds => {
  let hhmm   = formatSecondsToHHMM(seconds),
      split  = hhmm.split(':'),
      tothrs = parseInt(split[0]),
      days   = Math.floor(tothrs / 8),
      hrs    = tothrs % 8,
      mins   = parseInt(split[1]);

  return (days ? days + ' days' : '') + (hrs ? ' ' + hrs + ' hrs' : '') + (mins ? ' ' + mins + ' mins' : '');
};

// http://www.techrepublic.com/article/convert-the-local-time-to-another-time-zone-with-this-javascript/
const convertDateToTimeZone = (date, offset) => {
  let dlocalTime   = date.getTime(),
      dlocalOffset = date.getTimezoneOffset() * 60000,
      dutcMS       = dlocalTime + dlocalOffset,
      targetzonemc = dutcMS + (3600000 * offset);

  return new Date(targetzonemc);
};

// HTML tags
const removeTagsStr = str => str.replace(/(<([^>]+)>)/ig, '');
// carriage returns and line feeds
const removeCRLFStr = str => str.replace(/(\r\n|\n|\r)/ig, ' ');
// HTML entities
const removeEntityStr = str => str.replace(/(&(#?)(?:[a-z\d]+|#\d+|#x[a-f\d]+);)/ig, '');

// removeHTML :: String -> String
const removeHTML = str => Either.fromNullable(str)
  .map(removeEntityStr)
  .map(removeTagsStr)
  .map(removeCRLFStr)
  .fold(() => '', s => s);

/*
 Turn an object of {key1:value1, key2:value2, ...} into paramname=value[&...]
 Only works on shallow objects
 */
// acc += (idx > 0 ? '&' : '') + key + '=' + encodeURIComponent(objArry[key]);
const parameterize = objArry =>
  Object
    .keys(objArry)
    .reduce((acc, key) => {
      acc.push(key + '=' + encodeURIComponent(objArry[key]));
      return acc;
    }, ['?'])
    .join('&');

// urlStem and token are destructed from the config.json webservice object
const createLMSURL = ({urlStem, token}, fn, additionalParams = {}) => {
  let params = {
    wstoken           : token,
    wsfunction        : fn,
    moodlewsrestformat: 'json'
  };
  params     = Object.assign(params, additionalParams);
  return urlStem + WEBSERVICEPATH + parameterize(params);
};

/*
 wsOptions: {urlStem, token}
 fn: web service function to calls
 params: additional query string params
 resultKey: will wrap result in object w/ this key and result as value
 */
const createLMSQuery = (wsOptions, fn, params, resultKey) =>
  new Task((reject, resolve) => {
    fetch(createLMSURL(wsOptions, fn, params))
    // Since json() returns another promise, need to chain it down to resolve
      .then(res => res.json().then(json => {
        resolve(resultKey ? {[resultKey]: json} : json);
      }))
      .catch(e => {
        reject(fn + ' : ' + e);
      });
  });

// If params is a string, it's assumed it's a properly formatted endpoint + function + query
// and just runs it
const createLRSQuery = (wsOptions, method = 'POST', params, body) =>
  new Task((reject, resolve) => {
    let url = is(String, params) ? wsOptions.endpoint + params : wsOptions.endpoint + '/data/xAPI/statements' + parameterize(params);
    fetch(url, {
      method : method,
      body   : body,
      headers: {
        'Content-Type'            : 'application/json',
        'Authorization'           : 'Basic ' + wsOptions.token,
        'X-Experience-API-Version': wsOptions.version
      }
    })
      .then(res => res.json().then(json => {
        resolve(json);
      }))
      //.then(res =>  {
      //  console.log('from lrs',res)
      //  resolve([{}]);
      //})
      .catch(e => {
        reject('createLRSQuery: ' + e);
      });
  });

// Table could be "function" but since PostGREST turns database tables into functions
// I'm keeping with the origional terminology
const createSDBQuery = (wsOptions, table, params = {}) => {
  //console.log('createSDBQuery',wsOptions, table, params)
  return new Task((reject, resolve) => {
      fetch(wsOptions.endpoint + table + parameterize(params), {
        headers: wsOptions.headers
      })
        .then(res => res.json().then(json => {
          console.log('createSDBQuery Success', json);
          resolve(json);
        }))
        .catch(e => {
          console.log('createSDBQuery ERROR', e);
          reject(table + ' : ' + e);
        });
    }
  );
}

// Chain an array of Tasks in to one task
const chainTasks = (taskArry) => sequence(Task.of, taskArry);




module.exports = {
  trace,
  getUniqueKeys,
  dynamicSortObjArry,
  removeHTML,
  dateObjToSeconds,
  formatSecondsToDate,
  formatSecondsToDateObj,
  formatSecDurationToStr,
  convertTimeStrToHourStr,
  getMatchDates,
  getMatchTimes,
  parameterize,
  chainTasks,
  createLMSURL,
  createLMSQuery,
  createLRSQuery,
  createSDBQuery
};