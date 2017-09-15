/*eslint no-undef: "error"*/
/*eslint-env node*/

/**
 * Retrieves a list of courseCategories, courses, unique category names based on the courses
 * and a guess at the possible mode of delivery for each course.
 */

let moment           = require('moment'),
    {html2json}      = require('./../../../../shared/utils/html2json.js'),
    {request}        = require('./Rest'),
    {
      dynamicSortObjArry,
      getParameterString,
      formatSecondsToDate,
      formatSecDurationToStr,
      convertTimeStrToHourStr,
      getMatchDates,
      getMatchTimes
    }                = require('./../../../../shared/utils/Toolbox'),
    {requestCatalog} = require('./TotaraLoadCatalog'),
    webserviceConfig,
    courseCatalog,
    wsURL            = '/webservice/rest/server.php',
    deepLinkURL      = '/course/view.php?id=',
    privateStr       = '(PRIVATE)',
    vILTStr          = '(vILT)',
    classFields      = ['Delivery&nbsp;Mode', 'Region', 'Country', 'City', 'Private', 'Class&nbsp;date/time', 'Duration', 'Room'],
    classFieldsKey   = ['mod', 'region', 'country', 'city', 'private', 'schedule', 'duration', 'room'];

/**
 * Loads and cleans the courses.
 *
 * First we need to load the courseCategories. Courses only have an ID for the category.
 * This must be matched to the ID of the category to get the text name for it.
 *
 * wsConfig should contain keys for url, token and courseLinkStem (for generating
 * deep links)
 * @param wsConfig
 * @returns {Promise}
 */
module.exports.requestCalendar = (wsConfig, alwaysInclude) => {

  webserviceConfig = wsConfig;

  return new Promise((resolve, reject) => {
    let catalogReq, calendarReq;

    function createAllEventsWSURL () {
      return webserviceConfig.urlStem + wsURL + '?' + getParameterString({
        wstoken              : webserviceConfig.token,
        wsfunction           : 'core_calendar_get_calendar_events',
        'events[groupids][0]': 0,
        // 'events[eventids][0]' : 1,
        // 'events[courseids][0]': 0,
        // 'options[userevents]' : 0,
        // 'options[siteevents]' : 1,
        // 'options[ignorehidden]' : 1,
        moodlewsrestformat   : 'json'
      });
    }

    catalogReq = requestCatalog(wsConfig, alwaysInclude).then((data) => {
      console.log('Catalog loaded');
      return data;
    }).catch((err) => {
      reject('Error fetching course cleanedCatalogData', err);
    });

    calendarReq = request({
      json: true,
      url : createAllEventsWSURL()
    }).then((data) => {
      console.log('Calendar loaded');
      return data;
    }).catch((err) => {
      reject('Error fetching course calendar', err);
    });

    Promise.all([catalogReq, calendarReq]).then(data => {
      courseCatalog = data[0];
      resolve({
        calendar: condenseClasses(data[1].events),
        catalog : courseCatalog
      });
    }, err => {
      console.warn('Error fetching global calendar', err);
      reject(err);
    });

  });
};

function condenseClasses (clsData) {
  // Filter for only sessions and for the current user (user 0)
  return clsData
    .filter(cls => cls.eventtype === 'facetofacesession')
    .filter(cls => cls.userid === 0)
    .filter(cls => cls.userid === 0)
    .filter(cls => cls.name.indexOf(privateStr) === -1)
    .sort(dynamicSortObjArry('name'))
    .reduce((calendar, cls) => {
      let classObj    = parseClassObject(cls),
          calendarIdx = calendar.findIndex(c => c.name === classObj.fullname);

      if (calendarIdx < 0) {
        let courseObj = createCourseObject(classObj);

        if (courseObj) {
          calendar.push(courseObj);
        }
      } else {
        calendar[calendarIdx].classes.push(classObj);
      }
      return calendar;
    }, []);
}

const logReturn = obj => {
  console.log(obj);
  return obj;
};

function createCourseObject (classObj) {
  // Matching by name lead to some classes not showing due to a class/topic/course
  // mismatch. 
  // Changed MBP 8/31/17
  // let catalogMatch = getCatalogCourseByName(classObj.fullname);
  let catalogMatch = getCatalogCourseByID(classObj.courseid);

  // if(classObj.fullname.indexOf('Advanced Deployment') >= 0) {
  //  console.log(classObj.fullname, classObj, catalogMatch);
  // }

  if (catalogMatch) {
    return {
      classes   : [classObj],
      name      : classObj.fullname,
      region    : classObj.classDetails.region,
      duration  : classObj.duration,
      id        : catalogMatch.id,
      coursecode: catalogMatch.shortname,
      mod       : catalogMatch.deliverymode,
      category  : catalogMatch.category,
      summary   : catalogMatch.summary,
      deeplink  : catalogMatch.deeplink
    };
  }
  //} else {
  //  return {
  //    classes   : [classObj],
  //    name      : classObj.fullname,
  //    region    : classObj.classDetails.region,
  //    duration  : classObj.duration,
  //    id        : classObj.id,
  //    coursecode: 'n/a',
  //    mod       : 'n/a',
  //    category  : '',
  //    summary   : '',
  //    deeplink  : classObj.signupLink
  //  };
  //}
  //onsole.warn('No classes for course ',classObj.fullname);
  return null;
}

// Get a course by name from the loaded cleanedCatalogData data
// function getCatalogCourseByName(name) {
//   return courseCatalog.cleanedCatalogData.filter((course) => {
//     return course.fullname === name;
//   })[0];
// }

const getCatalogCourseByName = name => {
  return courseCatalog.cleanedCatalogData.filter(course => course.fullname === name)[0];
};

const getCatalogCourseByID = id => {
  return courseCatalog.cleanedCatalogData.filter(course => course.id === id)[0];
};

function parseClassObject (cls) {
  // Class schedule information is HTML, convert to an object to make it easier
  // to parse
  let classSchedule = html2json(cls.description),
      classDetails  = pickDetails(classSchedule);

  if (classDetails.city === 'Virtual') {
    classDetails.region  = 'Virtual instructor-led (vILT)';
    classDetails.country = 'Virtual';
  }

  //if(cls.name.indexOf('Coaching Fundamentals for Managers (vILT)') >= 0) {
  //  console.log(cls.name, classDetails.schedule.start.date, classDetails.schedule.start.endTime, cls.description);
  //}

  return {
    courseid    : cls.courseid,
    eventtype   : cls.eventtype,
    format      : cls.format,
    groupid     : cls.groupid,
    id          : cls.id,
    instance    : cls.instance,
    uuid        : parseInt(cls.uuid),
    fullname    : cls.name,
    duration    : formatSecDurationToStr(cls.timeduration),
    deeplink    : webserviceConfig.urlStem + deepLinkURL + cls.courseid,
    signupLink  : pickSignupLink(classSchedule),
    classDetails: classDetails,
    //datecreated : formatSecondsToDate(cls.timecreated),
    datemodified: formatSecondsToDate(cls.timemodified),
    startdate   : formatSecondsToDate(cls.timestart) //cls.startdate)
  };
}

//Get the sign up link URL
function pickSignupLink (obj) {
  return obj.child.reduce((p, c) => {
    if (c.tag === 'a') {
      p = c.attr.href;
    }
    return p;
  }, '');
}

// Iterate over a dl element and get the dd text for the matching dt
function pickDetails (obj) {
  return obj.child.reduce((p, c) => {
    if (c.tag === 'dl') {
      classFields.forEach((field, i) => {
        p[classFieldsKey[i]] = pickDetailField(field, c.child);
      });
    }
    return p;
  }, {});
}

/*
"<dl class="f2f"><dt>Delivery&nbsp;Mode</dt><dd>Virtual instructor-led</dd><dt>City</dt><dd>Virtual</dd><dt>Facilitator</dt><dd>Neerja Bhatia</dd><dt>Go/No-Go&nbsp;decision</dt><dd>Decision not yet made</dd><dt>Class&nbsp;date/time</dt><dd>June 8, 2017, 4:30 PM - 6:00 PM Asia/Kolkata</dd><dt>Duration</dt><dd>1 hour 30 mins</dd><dt>Room</dt><dd></dd></dl><a href="https://learning.redhat.com/mod/facetoface/signup.php?s=1248">Sign-up for this Instructor-led class</a>"
 */

/*
 Look over the dt/dd list and find the data we want
 since a dd is the next element we're getting it with the i+1
 */
function pickDetailField (field, arry) {
  return arry.reduce((p, c, i) => {
    if (c.tag === 'dt') {
      if (c.child[0].text === field) {
        if (field === 'Class&nbsp;date/time') {
          p = convertDateStringToDateObj(arry[i + 1].child[0].text);
        } else if (field === 'Room') {
          // This is a list of spans we need to parse through
          if (arry[i + 1].child) {
            p = {
              room    : arry[i + 1].child[0] ? arry[i + 1].child[0].child[0].text : '',
              building: arry[i + 1].child[1] ? arry[i + 1].child[1].child[0].text : '',
              address : arry[i + 1].child[2] ? arry[i + 1].child[2].child[0].text : ''
            };
          } else {
            p = {room: '', building: '', address: ''};
          }

        } else {
          // an element that we need to grab text node from
          p = arry[i + 1].child ? arry[i + 1].child[0].text : '';
        }
      }
    }
    return p;
  }, '');
}

/*
 The calendar ws returns the date, time and time zone in a formatted string, ex:
 October 17, 2016 - October 18, 2016, 9:00 AM - 5:00 PM America/New_York
 Need to bread it up into pieces
 */
function convertDateStringToDateObj (str) {
  let dates     = getMatchDates(str),
      times     = getMatchTimes(str).map((t) => convertTimeStrToHourStr(t, true)),
      parts     = str.split(' '),
      zone      = parts[parts.length - 1],
      startDate = dates[0] ? dates[0].trim() : 'January 1, 1970',
      endDate   = dates[1] ? dates[1].trim() : null;

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
}