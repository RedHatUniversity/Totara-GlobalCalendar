let {formatSecDurationToStr, formatSecondsToDate, formatSecondsToDateObj, dynamicSortObjArry} = require('../shared');
let {curry}                                                                                   = require('ramda');

/*
Array of
{ facetoface_id: 472,
  course_id: 1073,
  content_owner: 'RHU',
  signup_id: null,
  private: '1',
  facilitator: 'Angela Pullen',
  producer: null,
  course_category_name: 'Manager Development and Team Leadership',
  course_code: 'RHU-0042',
  course_name: 'Leading the Red Hat Way (vILT) (PRIVATE)',
  mode_of_delivery: 'Instructor-led',
  class_start_time: '1482588000',
  class_end_time: '1482703200',
  timezone: 'America/New_York',
  class_region: '{"d4cd0dabcf4caa22ad92fab40844c786":{"option":"NA","icon":"","default":1,"delete":0}}',
  class_city: 'Raleigh',
  class_country: 'United States',
  room_name: null,
  duration: '2.50',
  session_capacity: 12,
  session_fullyattended: 0,
  session_noshowattendees: 0,
  facetofaceid: 472 }

 */


// Counter in place for testing w/ Jesse
// let counter  = 0;
// let today = new Date();

const audienceAndIsInInclude = (include, cls) => cls.audience_visible === 2 || include.indexOf(cls.course_id) >= 0;

const cleanCalendarResults = (raw, alwaysInclude) => raw
  .filter(cls => cls.private !== '1')
  .filter(cls => cls.course_name.indexOf('(PRIVATE)') === -1)
  .filter(cls => audienceAndIsInInclude(alwaysInclude, cls))
  .map(cls => {
    // Push vILT to a timezone
    cls.timezone = cls.timezone === '99' ? cls.timezone = 'America/New_York' : cls.timezone;
    return cls;
  })
  .sort(dynamicSortObjArry('name'))
  .reduce((calendar, cls) => {
    let calendarIdx      = calendar.findIndex(c => c.name === cls.course_name),
        hydratedClassObj = hydrateClass(cls);

    //if(hydratedClassObj.startdate > today) console.log(++counter)

    if (calendarIdx >= 0) {
      calendar[calendarIdx].classes.push(hydratedClassObj);
    } else {
      // Create the calendar entry using the first class information a template
      calendar.push({
        name      : cls.course_name,
        duration  : cls.duration,
        id        : cls.course_id,
        coursecode: cls.course_code,
        mod       : cls.mode_of_delivery,
        category  : cls.course_category_name,
        private   : 0,
        audience  : cls.audience_visible,
        deeplink  : 'https://learning.redhat.com/course/view.php?id=' + cls.course_id,
        classes   : [hydratedClassObj]
      });
    }

    return calendar;
  }, []);

const hydrateClass = cls => ({
  courseid     : cls.course_id,
  coursecode   : cls.course_code,
  f2fId        : cls.facetofaceid,
  capacity     : cls.session_capacity,
  fullyAttended: cls.session_fullyattended,
  noShow       : cls.session_noshowattendees,
  mod          : cls.mode_of_delivery,
  category     : cls.course_category_name,
  fullname     : cls.course_name,
  private      : cls.private === '1',
  duration     : cls.duration,
  deeplink     : 'https://learning.redhat.com/course/view.php?id=' + cls.course_id,
  signupLink   : 'https://learning.redhat.com/mod/facetoface/signup.php?s=' + cls.signup_id,
  startdate    : formatSecondsToDateObj(cls.class_start_time.split(',')[0]),
  enddate      : formatSecondsToDateObj(cls.class_end_time.split(',')[0]),
  region       : parseRegionJSON(cls.class_region),
  country      : cls.class_country,
  city         : cls.class_city,
  timeZone     : cls.timezone,
  room         : cls.room_name,
  raw          : cls
});


// JSON looks like, with different first keys
// { d4cd0dabcf4caa22ad92fab40844c786: { option: 'NA', icon: '', default: 1, delete: 0 } }
const parseRegionJSON = json => {
  let region = '';
  // json could be empty value of '[]'
  if (json && json.length > 2) {
    try {
      let parsed = JSON.parse(json);
      region     = parsed[Object.keys(parsed)].option;
    } catch (e) {
      console.warn('Could not parse region', e, json);
    }
  }
  return region;
};

module.exports = {
  cleanCalendarResults
};