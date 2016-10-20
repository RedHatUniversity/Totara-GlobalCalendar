/*eslint no-undef: "error"*/
/*eslint-env node*/

/**
 * Retrieves a list of courseCategories, courses, unique category names based on the courses
 * and a guess at the possible mode of delivery for each course.
 */

let {request}           = require('./Rest'),
    {requestCategories} = require('./TotaraLoadCategories'),
    {
      dynamicSortObjArry,
      removeTagsStr,
      removeEntityStr,
      getParameterString,
      formatSecondsToDate
    }                   = require('./../../../../shared/utils/Toolbox'),
    webserviceConfig,
    wsURL               = '/webservice/rest/server.php',
    deepLinkURL         = '/course/view.php?id=',
    courseCategories,
    hiddenCategories    = ['(hidden) Course Templates', 'n/a']; // Courses with these courseCategories will be removed from the list

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
module.exports.requestCatalog = (wsConfig) => {

  webserviceConfig = wsConfig;

  return new Promise((resolve, reject) => {
    let categoryReq, catalogReq;

    function createWSURL(funct) {
      return webserviceConfig.urlStem + wsURL + '?' + getParameterString({
          wstoken           : webserviceConfig.token,
          wsfunction        : funct,
          moodlewsrestformat: 'json'
        });
    }

    categoryReq = requestCategories(wsConfig).then((data)=>{
      console.log('Loaded categories');
      return data;
    }).catch((err)=> {
      reject('Error fetching course categories', err);
    });

    catalogReq = request({
      json: true,
      url : createWSURL('core_course_get_courses')
    }).then((data)=> {
      console.log('Loaded catalog');
      return data;
    }).catch((err)=> {
      reject('Error fetching course catalog', err);
    });

    Promise.all([categoryReq, catalogReq]).then(data => {
      courseCategories = data[0];
      let cleanedCatalogData = cleanCatalogData(data[1]);
      resolve({
        courseCategories,
        cleanedCatalogData: cleanedCatalogData.data,
        courseCategoryList: cleanedCatalogData.categories,
        courseMODList     : cleanedCatalogData.mod
      });
    }, err => {
      console.warn('Error fetching catalog',err);
      reject(err);
    });

  });
};

function cleanCatalogData(src) {
  let uniqueCategories = {},
      uniqueMoD        = {},
      data             = src.reduce((p, c) => {
        let category = getCourseCategory(c.categoryid),
            mod;
        // None in the hidden categories and only available to all learners
        if (!hiddenCategories.includes(category) && c.audiencevisible === 2) {
          mod = getCourseDeliveryMode(c);
          p.push({
            category    : category,
            datecreated : formatSecondsToDate(c.timecreated),
            datemodified: formatSecondsToDate(c.timemodified),
            startdate   : formatSecondsToDate(c.startdate),
            format      : c.format,
            id          : c.id,
            coursecode  : c.idnumber,
            lang        : c.lang,
            numsections : c.numsections,
            fullname    : c.fullname,
            shortname   : c.shortname,
            summary     : removeTagsStr(removeEntityStr(c.summary)),
            deliverymode: mod,
            deeplink    : webserviceConfig.urlStem + deepLinkURL + c.id
          });

          // Build a unique list of these
          uniqueCategories[category] = null;
          uniqueMoD[mod]             = null;

        }
        return p;
      }, [])
        .sort(dynamicSortObjArry('fullname'));

  return {
    data,
    categories: Object.keys(uniqueCategories),
    mod       : Object.keys(uniqueMoD)
  };
}

// Match the ID of a course category to the loaded courseCategories
function getCourseCategory(courseCategoryID) {
  let category = courseCategories.filter((cat) => {
    return cat.id === courseCategoryID;
  })[0];

  // Course id === 1 has no category ID and will break filter
  // This seems to be a system default entry for the name of the LMS
  return category && category.hasOwnProperty('name') ? category.name : 'n/a';
}

/*
 Make a best guess at the mode of delivery. MoD is a custom field and doesn't come
 back via web service calls.
 */
function getCourseDeliveryMode(courseObj) {

  let format          = courseObj.format,
      coursetype      = courseObj.coursetype,
      coursefmt0Value = courseObj.courseformatoptions[0].value,
      numsections     = courseObj.hasOwnProperty('numsections') ? courseObj.numsections : null;

  if (format === 'topics' && (coursetype === 0 || coursetype === 2) && coursefmt0Value === 1 && numsections === 1) {
    return 'ROLE'
  } else if (format === 'topics' && coursetype === 2 && (coursefmt0Value === 3 || coursefmt0Value === 4)) {
    return 'Instructor-led';
  } else if (format === 'topics' && coursetype === 2 && numsections === 10) {
    return 'n/a';
  }

  // Default to this
  // format === 'singleactivity' && coursetype === 0 && coursefmt0Value === 'scorm' && numsections === null
  return 'Online self paced';
}