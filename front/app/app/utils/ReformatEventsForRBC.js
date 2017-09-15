/**
 * Reformat the web service output for use in the react-big-calendar component:
 * https://github.com/intljusticemission/react-big-calendar
 */

import moment from 'moment';
import { tzTable } from './timezones';
import {
  uniqueArry,
  convertDateToTimeZone
} from './../../../../shared/utils/Toolbox';

// Create the data
function getReformattedData (data) {
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

function reformatEventArray (data) {
  return data.reduce((evts, course) => {

    course.classes.forEach((cls) => {
      //console.log('Reformatting', cls);

      let startTime = cls.classDetails.schedule.start,
          endTime   = cls.classDetails.schedule.end,
          region    = cls.classDetails.region,
          country   = cls.classDetails.country,
          city      = cls.classDetails.city;

      // Error in Totara web services with Singapore
      if (city.toLowerCase() === 'singapore') {
        country = 'Singapore';
      }

      if (!isKeyValInObjArray(evts, 'link', cls.signupLink)) {
        evts.push({
          title   : cls.fullname,
          allDay  : false, //isAllDay(startTime, endTime),
          start   : getEventStartTime(startTime),
          end     : getEventEndTime(startTime, endTime),
          desc    : course.summary,
          link    : cls.signupLink,
          courseid: cls.courseid,
          id      : cls.id,
          category: course.category,
          mod     : cls.classDetails.mod,
          region  : region,
          country : country,
          city    : city
        });
      }

    });

    return evts;
  }, []);
}

function isKeyValInObjArray (arry, key, val) {
  return arry.filter(e => e[key] === val).length > 0;
}

// Determine if an event is all day
function isAllDay (start, end) {
  // If it has an end date then it's multi-day
  if (end.date) {
    return true;
  }
  let starthr = getHourFromTimeStr(start.startTime),
      endhr   = getHourFromTimeStr(start.endTime);

  // starts before 9 and ends after 4
  return (starthr <= 9 && endhr >= 16);
}

function getHourFromTimeStr (timestr) {
  return parseInt(timestr.split(':')[0]);
}

function convertDateTimeToMoment (date, time) {
  return moment(date + ' ' + time, 'MMMM D, YYYY HH:mm');
}

function getEventStartTime (start) {
  let date = convertDateTimeToMoment(start.date, start.startTime).toDate();
  return convertDateToTimeZone(date, getTimeZoneOffset(start.zone));
}

function getEventEndTime (start, end) {
  let date;
  if (!end.date) {
    date = convertDateTimeToMoment(start.date, start.endTime);
  } else {
    date = convertDateTimeToMoment(end.date, end.endTime);
  }
  return convertDateToTimeZone(date.toDate(), getTimeZoneOffset(start.zone));
}

// Convert event's local timezone in to the user's timezone
function getTimeZoneOffset (tgtzone) {
  // Disabled, MP 5/24/17
  //let zoneObject = tzTable.filter((zone) => zone.utc.includes(tgtzone))[0];
  //
  //const wsOffset = -4;
  //
  //if (zoneObject) {
  //  console.log('Time zone',tgtzone,zoneObject.offset + wsOffset);
  //  return zoneObject.offset + wsOffset;
  //}
  //console.warn('No timezone found for', tgtzone);
  return 0;
}

// TODO merge building these into the reformatEventsArray function

// Extract unique courseCategories from the loaded courses
function buildCategoryList (data) {
  return uniqueArry(data.map((course) => course.category));
}

// Extract unique MoDs from the loaded courses
function buildMoDList (data) {
  return uniqueArry(data.map((course) => course.mod));
}

// Extract unique MoDs from the loaded courses
function buildRegionList (data) {
  return uniqueArry(data.map((course) => course.region));
}

// Extract unique MoDs from the loaded courses
function buildCountryList (data) {
  return uniqueArry(data.map((course) => course.country));
}

// Extract unique MoDs from the loaded courses
function buildCityList (data) {
  return uniqueArry(data.map((course) => course.city));
}

/*
 Builds an tree of the cities in countries and countries in regions for the
 filtering menus. Keys are the names
 */
function buildHierarchy (data) {
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