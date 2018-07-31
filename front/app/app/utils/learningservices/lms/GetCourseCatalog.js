/*eslint no-undef: "error"*/
/*eslint-env node*/

let Task                           = require('data.task'),
    {compose, curry, prop, filter} = require('ramda'),
    {first}                        = require('lodash'),
    {
      removeHTML, chainTasks, createLMSQuery, dynamicSortObjArry,
      formatSecondsToDate
    }                              = require('../shared'),
    {requestCategories}            = require('./GetCategories');

const prohibitedCategories = ['(hidden) Course Templates', 'n/a'];

/**
 * Retrieves a list of courses from the Moodle core_course_get_courses web
 * service.
 * It first fetches the list of categories so that the plain text category can
 * be assigned to each course from the category ID prop.
 * The RHU mode of delivery custom field isn't conveyed via the results, so we
 * guess at the value based on the course template set up.
 * Courses matching one of the prohibitedCategories are removed from the results.
 * Only courses available to all audiences are returned.
 *
 * @param wsOptions {urlStem, token}
 * @param courseIds Array of course IDs to fetch from the LMS (Optional)
 * @returns {Task}
 */
const requestCatalog = (wsOptions, courseIds=[]) => {
  return new Task((reject, resolve) => {
    let categoryReq, catalogReq, courseOptions;

    if (courseIds.length) {
      courseOptions = courseIds.reduce((acc, id, idx) => {
        acc[('options[ids][' + idx + ']')] = id;
        return acc;
      }, {});
    }

    categoryReq = requestCategories(wsOptions);
    catalogReq  = createLMSQuery(wsOptions, 'core_course_get_courses', courseOptions);
    chainTasks([categoryReq, catalogReq]).fork(reject,
      res => {
        resolve(_compactCatalog(wsOptions, res, (courseIds.length)));
      });
  });
};

// If hasOptions, then we requested specific course IDs and don't filtere them out
const _compactCatalog = (options, resultArry, hasOptions) => {
  let filteredCatalog;
  if (!hasOptions) {
    filteredCatalog = resultArry[1]
      .filter(_isNotInProhibitedCategory(resultArry[0]))
      .filter(_isNotSiteFormat)
      .filter(_isForAllLearners);
  } else {
    filteredCatalog = resultArry[1];
  }
  return _parseCatalog(options, resultArry[0], filteredCatalog);
};

const _getProhibitedCategoryIds = categories => categories.filter(c => prohibitedCategories.includes(c.name)).map(c => c.id);

const _isNotInProhibitedCategory = curry((categories, course) => !_getProhibitedCategoryIds(categories).includes(course.categoryid));

// Totara returns an entry for the site itself which needs to be filtered out
const _isNotSiteFormat = course => course.format !== 'site';

const _isForAllLearners = course => course.audiencevisible === 2;

const _isObjId = curry((id, obj) => obj.id === id);

const _getCategoryName = (categories, courseCategoryID) =>
  compose(prop('name'), first, filter(_isObjId(courseCategoryID)))(categories);

const _parseCatalog = (options, categories, catalog) =>
  catalog
    //.filter(_isNotInProhibitedCategory(categories))
    //.filter(_isNotSiteFormat)
    //.filter(_isForAllLearners)
    .sort(dynamicSortObjArry('fullname'))
    .reduce((acc, course) => {
      acc.push({
        category    : _getCategoryName(categories, course.categoryid),
        datecreated : formatSecondsToDate(course.timecreated),
        datemodified: formatSecondsToDate(course.timemodified),
        startdate   : formatSecondsToDate(course.startdate),
        format      : course.format,
        id          : course.id,
        coursecode  : course.idnumber,
        lang        : course.lang,
        numsections : course.numsections,
        fullname    : course.fullname,
        shortname   : course.shortname,
        summary     : removeHTML(course.summary),
        deliverymode: _getCourseDeliveryMode(course),
        deeplink    : options.urlStem + '/course/view.php?id=' + course.id
      });
      return acc;
    }, []);

/*
 Make a best guess at the mode of delivery. MoD is a custom field and doesn't come
 back via web service calls.
 */
const _getCourseDeliveryMode = (courseObj) => {
  let format          = courseObj.format,
      coursetype      = courseObj.coursetype,
      coursefmt0Value = courseObj.courseformatoptions[0].value,
      numsections     = courseObj.hasOwnProperty('numsections') ? courseObj.numsections : null;

  if (format === 'topics' && (coursetype === 0 || coursetype === 2) && coursefmt0Value === 1 && numsections === 1) {
    return 'ROLE';
  } else if (format === 'topics' && coursetype === 2 && (coursefmt0Value === 3 || coursefmt0Value === 4)) {
    return 'Instructor-led';
  } else if (format === 'topics' && coursetype === 2 && numsections === 10) {
    return 'n/a';
  }

  // Default to this
  // format === 'singleactivity' && coursetype === 0 && coursefmt0Value === 'scorm' && numsections === null
  return 'Online self paced';
};

module.exports = {requestCatalog};