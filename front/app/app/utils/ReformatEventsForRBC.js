/**
 * Reformat the web service output for use in the react-big-calendar component:
 * https://github.com/intljusticemission/react-big-calendar
 */

import moment from 'moment-timezone';
import {uniqueArry} from './../../../../shared/utils/Toolbox';

// Create the data
function getReformattedData(data) {
  let events = reformatEventArray(data);
  return {
    events   : events,
    mod      : buildMoDList(events),
    category : buildCategoryList(events),
    region   : buildRegionList(events),
    country  : buildCountryList(events),
    city     : buildCityList(events),
    hierarchy: buildHierarchy(events)
  };
}

function reformatEventArray(data) {
  return data.reduce((evts, course) => {
    course.classes.forEach(cls => {

      let startTime = cls.startdate,
          endTime   = cls.enddate,
          region    = cls.region,
          country   = cls.country,
          city      = cls.city,
          timeZone  = cls.timeZone;

      // Error in Totara web services with Singapore
      if (city.toLowerCase() === 'singapore') {
        country = 'Singapore';
      }

      if (!isKeyValInObjArray(evts, 'link', cls.signupLink)) {
        let startM        = getEventStartTimeMoment(startTime, timeZone),
            endM          = getEventEndTimeMoment(startTime, endTime, timeZone),
            localTZ       = moment.tz.guess(),
            localStartMTZ = startM.clone().tz(localTZ),
            localEndMTZ   = endM.clone().tz(localTZ);

        evts.push({
          title   : cls.fullname,
          allDay  : false,
          start   : localStartMTZ.toDate(),
          end     : localEndMTZ.toDate(),
          desc    : '',
          link    : cls.signupLink,
          courseid: cls.courseid,
          id      : cls.courseid,
          category: cls.category,
          mod     : cls.mod,
          region  : region,
          country : country,
          city    : city
        });
      }
    });

    return evts;
  }, []);
}

function isKeyValInObjArray(arry, key, val) {
  return arry.filter(e => e[key] === val).length > 0;
}

// DISABLED
// Determine if an event is all day
function isAllDay(start, end) {
  // If it has an end date then it's multi-day
  if (end.date) {
    return true;
  }
  let starthr = getHourFromTimeStr(start.startTime),
      endhr   = getHourFromTimeStr(start.endTime);

  // starts before 9 and ends after 4
  return starthr <= 9 && endhr >= 16;
}

function getHourFromTimeStr(timestr) {
  return parseInt(timestr.split(':')[0]);
}

function convertDateTimeToMoment(date, time, tz) {
  // return moment.tz(date + ' ' + time, 'MMMM D, YYYY HH:mm', tz);
  return moment.tz(date, 'MMMM D, YYYY HH:mm', tz);
}

function getEventStartTimeMoment(start, tz) {
  // return convertDateTimeToMoment(start.date, start.startTime, tz);
  return convertDateTimeToMoment(start, 0, tz);
}

function getEventEndTimeMoment(start, end, tz) {
  let date;
  if (!end) {
    // date = convertDateTimeToMoment(start.date, start.endTime, tz);
    date = convertDateTimeToMoment(start, 0, tz);
  } else {
    // date = convertDateTimeToMoment(end.date, end.endTime, tz);
    date = convertDateTimeToMoment(end, 0, tz);
  }
  // return convertDateToTimeZone(date.toDate(), getTimeZoneOffset(start.zone));
  return date;
}

// Convert event's local timezone in to the user's timezone
function getTimeZoneOffset(startM, tgtzone) {
  // let browserTZOffset = moment().utcOffset() / 60;
  // console.log(startM.clone().local().format("DD-MM-YYYY h:mm:ss A")); // local time
  console.log(startM.clone().tz(tgtzone).toDate()); // 30-03-2017 2:34:22 PM
  // console.warn('No timezone found for', tgtzone);
  return 0;
}

// TODO merge building these into the reformatEventsArray function

// Extract unique courseCategories from the loaded courses
function buildCategoryList(data) {
  return uniqueArry(data.map(course => course.category));
}

// Extract unique MoDs from the loaded courses
function buildMoDList(data) {
  return uniqueArry(data.map(course => course.mod));
}

// Extract unique MoDs from the loaded courses
function buildRegionList(data) {
  return uniqueArry(data.map(course => course.region));
}

// Extract unique MoDs from the loaded courses
function buildCountryList(data) {
  return uniqueArry(data.map(course => course.country));
}

// Extract unique MoDs from the loaded courses
function buildCityList(data) {
  return uniqueArry(data.map(course => course.city));
}

/*
 Builds an tree of the cities in countries and countries in regions for the
 filtering menus. Keys are the names
 */
function buildHierarchy(data) {
  return data.reduce((hier, cls) => {
    if (!hier.hasOwnProperty(cls.region)) {
      hier[cls.region] = {};
    }
    if (!hier[cls.region].hasOwnProperty(cls.country)) {
      hier[cls.region][cls.country] = {};
    }
    if (!hier[cls.region][cls.country].hasOwnProperty(cls.city)) {
      hier[cls.region][cls.country][cls.city] = {};
    }
    return hier;
  }, {});
}

module.exports.getReformattedData = getReformattedData;
