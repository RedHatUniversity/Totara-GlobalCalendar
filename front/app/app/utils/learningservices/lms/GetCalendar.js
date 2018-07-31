/*eslint no-undef: "error"*/
/*eslint-env node*/

let Task                            = require('data.task'),
    Maybe                           = require('data.maybe'),
    {prop, curry, memoize, compose} = require('ramda'),
    {html2json}                     = require('./html2json'),
    {
      createLMSQuery, dynamicSortObjArry, formatSecondsToDate, getMatchDates,
      getMatchTimes, formatSecDurationToStr,
      convertTimeStrToHourStr
    }                               = require('../shared');

const privateStr = '(private)';
// Our standard is to append '(private)' to the names of private courses

/**
 * Retrieves user f2f class calendar information from the Moodle
 * core_calendar_get_calendar_events web service.
 * To more information to the results such as deep links and categories, the
 * course catalog is also loaded to provide this information.
 * Once loaded, the result for each session is condensed under an object for
 * each unique class name.

 // web service call options
 userevents int  Default to "1" //Set to true to return current user's user events
 siteevents int  Default to "1" //Set to true to return global events
 timestart int  Default to "0" //Time from which events should be returned
 timeend int  Default to "0" //Time to which the events should be returned. We treat 0 and null as no end
 ignorehidden int  Default to "1" //Ignore hidden events or not

 Usage
 requestCalendar(config.webservice).fork(console.warn, log);

 *
 * @param wsConfig {urlStem, token}
 * @param userId Optionally limit the results to that of one user's calendar
 * @returns {Task}
 */

const requestCalendar = (wsOptions, userId) => {
  return new Task((reject, resolve) => {
    createLMSQuery(wsOptions, 'core_calendar_get_calendar_events', {
      'events[groupids][0]'  : 0,
      'options[ignorehidden]': 1
    }).fork(reject, res => {
      resolve(_compactEvents(wsOptions, userId, res.events));
    });
  });
};

// Clean up the class data into a usable structure
const _compactEvents = (options, userId = 0, events) =>
  _filterEvents(userId, events)
    .reduce((calendar, cls) => {
      let classObj    = _parseClassObject(options, cls),
          calendarIdx = calendar.findIndex(c => c.name === classObj.fullname);
      // If the class already exists, add an instance. If not create it
      if (calendarIdx >= 0) {
        calendar[calendarIdx].classes.push(classObj);
      } else {
        let courseObj = _createCourseObject(classObj);
        if (courseObj) {
          calendar.push(courseObj);
        }
      }
      return calendar;
    }, []);

const _filterEvents = (userId, events) => events
  .filter(isFace2FaceSession)
  .filter(isPrivate)
  .filter(isForCurrentUser(userId))
  .sort(dynamicSortObjArry('name'));

const isFace2FaceSession = (clsObj) => clsObj.eventtype === 'facetofacesession';
const isPrivate          = (clsObj) => clsObj.name.toLowerCase().indexOf(privateStr) === -1;
const isForCurrentUser   = curry((userId, clsObj) => parseInt(clsObj.userid) === userId);

const _parseClassObject = (options, cls) => ({
  userid      : prop('userid', cls),
  courseid    : prop('courseid', cls),
  eventtype   : prop('eventtype', cls),
  format      : prop('format', cls),
  groupid     : prop('groupid', cls),
  id          : prop('id', cls),
  instance    : prop('instance', cls),
  fullname    : prop('name', cls),
  deeplink    : options.urlStem + '/course/view.php?id=' + prop('courseid', cls),
  uuid        : parseInt(prop('uuid', cls)),
  signupLink  : _gSignupLink(cls),
  classDetails: _gClassDetails(cls),
  duration    : formatSecDurationToStr(prop('timeduration', cls)),
  datecreated : formatSecondsToDate(prop('timecreated', cls)),
  datemodified: formatSecondsToDate(prop('timemodified', cls)),
  startdate   : formatSecondsToDate(prop('timestart', cls))
});

// Utils to work with html2json output
// Memoize to cache output
const _html2json     = (str) => memoize(html2json)(str);
const _gSignupLink   = (str) => compose(_getSignupLink, _html2json, prop('description'))(str);
const _gClassDetails = (str) => compose(_getClassDetails, _html2json, prop('description'))(str);
const _getMatchTags  = curry((tag, arry) => arry.filter(e => e.tag === tag));
const _getMatchTag   = curry((tag, arry) => _getMatchTags(tag, arry)[0]);
const _getTagAttr    = curry((attr, tag) => tag.attr[attr]);
const _getATag       = _getMatchTag('a');
const _getHref       = _getTagAttr('href');
const _getDlTags     = _getMatchTags('dl');

/*
 Sample details HTML
 <dl class="f2f">
 <dt>Delivery&nbsp;Mode</dt>
 <dd>Instructor-led</dd>
 <dt>Region</dt >
 <dd>APAC</dd>
 <dt>Country</dt>
 <dd>China</dd>
 <dt>City</dt>
 <dd>Beijing - Parkview Green</dd>
 <dt>Facilitator</dt>
 <dd>Yuandu Wang</dd>
 <dt>Class&nbsp;date/time</dt>
 <dd>April 24, 2017 - April 27, 2017, 9:00 AM - 5:00 PM Asia/Hong_Kong<br />April 28, 2017, 9:00 AM - 2:00 PM Asia/Hong_Kong</dd>
 <dt>Duration</dt>
 <dd>3 days 13 hours</dd>
 <dt>Room</dt>
 <dd>
 <span class="room room_name">beijing1-08-forbidden-city-14-p/beijing1-08-the-great-wall-12-p-vc</span>
 <span class="room room_building">Parkview Green</span>
 <span class="room room_address">8F Tower A. Beijing Parkview Green Fang Cao Di, No.9 dongdaqiao Road,Chaoyang District | Beijing PRC 100020, China</span>
 </dd>
 <dt>Facilitator</dt>
 <dd><a href="https://learning.redhat.com/user/view.php?id=11003">Yuandu Wang</a></dd>
 </dl>
 <a href="https://learning.redhat.com/mod/facetoface/signup.php?s=562">Sign-up for this Instructor-led class</a>
 */

const _getSignupLink = obj => Maybe.of(_getATag(obj.child)).map(_getHref).getOrElse('');

// Iterate over a dl element and get the dd text for the matching dt
const _getClassDetails = obj => {
  let classFields    = ['Delivery&nbsp;Mode', 'Region', 'Country', 'City', 'Facilitator', 'Private', 'Class&nbsp;date/time', 'Duration', 'Room'],
      newClassFields = ['mod', 'region', 'country', 'city', 'facilitator', 'private', 'schedule', 'duration', 'room'],
      getField       = getAbbrvFieldName(classFields, newClassFields);

  return _getDlTags(obj.child).reduce((acc, el) => {
    classFields.forEach(field => acc[getField(field)] = _getDetailField(field, el.child));
    return acc;
  }, {});
};

const getAbbrvFieldName = curry((arryFull, arryAbbrv, field) => arryAbbrv[arryFull.indexOf(field)]);

// Look over the dt/dd list and find the data we want since a dd is the next
// element we're getting it with the i+1
const _getDetailField = (field, arry) => {
  return arry.reduce((acc, el, idx) => {
    if (el.tag === 'dt' && el.child[0].text === field) {
      if (field === 'Class&nbsp;date/time') {
        acc = _getFieldDateTime(arry[idx + 1]);
      } else if (field === 'Room') {
        acc = _getFieldRoom(arry[idx + 1]);
      } else {
        acc = _getFieldText(arry[idx + 1]);
      }
    }
    return acc;
  }, '');
};

const _getFieldText = (el) => Maybe.fromNullable(el)
  .chain(e => Maybe.fromNullable(e.child).map(c => c[0].text))
  .getOrElse('');

const _getFieldDateTime = (el) => _convertDateStringToDateObj(_getFieldText(el));

const _getFieldRoom = (el) =>
  Maybe.fromNullable(el.child).map(_getFieldRoomDetails).getOrElse({
    room    : 'n/a',
    building: 'n/a',
    address : 'n/a'
  });

const _getFieldRoomDetails = (el) => ({
  room    : _getFieldText(el[0]),
  building: _getFieldText(el[1]),
  address : _getFieldText(el[2])
});

const _trimStr = s => s.trim();
const _last    = a => a.slice(-1)[0];

// The calendar ws returns the date, time and time zone in a formatted string, ex:
// October 17, 2016 - October 18, 2016, 9:00 AM - 5:00 PM America/New_York
// Need to bread it up into pieces
const _convertDateStringToDateObj = (str) => {
  let dates     = getMatchDates(str),
      times     = getMatchTimes(str).map(convertTimeStrToHourStr),
      zone      = _last(str.split(' ')),
      startDate = Maybe.fromNullable(dates[0]).map(_trimStr).getOrElse('January 1, 1970'),
      endDate   = Maybe.fromNullable(dates[1]).map(_trimStr).getOrElse(null);

  return {
    start : {
      date     : startDate,
      startTime: times[0],
      endTime  : times[1],
      zone     : zone
    }, end: {
      date     : endDate,
      startTime: times[0],
      endTime  : times[1],
      zone     : zone
    }
  };
};

const _createCourseObject = (classObj) => {
  return {
    classes : [classObj],
    name    : classObj.fullname,
    region  : classObj.classDetails.region,
    duration: classObj.duration
  };
};

module.exports = {
  requestCalendar
};