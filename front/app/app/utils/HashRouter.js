/**
 * Simple router
 * Matt Perkins, hello@mattperkins.me
 *
 */

/**
 * Broadcast the change event and let the application determine how to handle
 * @param evt
 */
function onHashChange(evt) {
  console.log('Hash changed');
}

/**
 * Parses the route and query string from the current URL fragment
 * @returns {{route: string, query: {}}}
 */
export function getCurrentRoute() {
  var fragment    = getURLFragment(),
      parts       = fragment.split('?'),
      route       = '/' + parts[0],
      queryStr    = decodeURIComponent(parts[1]),
      queryStrObj = parseQueryStr(queryStr);

  return {route: route, data: queryStrObj};
}

/**
 * Parses a query string into key/value pairs
 * @param queryStr
 * @returns {{}}
 */
function parseQueryStr(queryStr) {
  var obj   = {},
      parts = queryStr.split('&');

  parts.forEach(function (pairStr) {
    var pairArr     = pairStr.split('=');
    obj[pairArr[0]] = pairArr[1];
  });

  return obj;
}



/**
 * Combines a route and data object into a proper URL hash fragment
 * @param route
 * @param dataObj
 */
export function setRoute(route, dataObj) {
  var path = route,
      data = [];
  if (dataObj !== null && dataObj !== undefined) {
    path += "?";
    for (var prop in dataObj) {
      if (prop !== 'undefined' && dataObj.hasOwnProperty(prop)) {
        data.push(prop + '=' + encodeURIComponent(dataObj[prop]));
      }
    }
    path += data.join('&');
  }

  //console.log('Router, setting URL fragment to: ' + path);

  updateURLFragment(path);
}

/**
 * Returns everything after the 'whatever.html#' in the URL
 * Leading and trailing slashes are removed
 * reference- http://lea.verou.me/2011/05/get-your-hash-the-bulletproof-way/
 *
 * @returns {string}
 */
export function getURLFragment() {
  var fragment = location.hash.slice(1);
  return fragment.toString().replace(/\/$/, '').replace(/^\//, '');
}

/**
 * Set the URL hash fragment
 * @param path
 */
function updateURLFragment(path) {
  window.location.hash = path;
}

// window.addEventListener('hashchange', onHashChange, false);
let _routeMap      = Object.create(null);

/**
 * Map a route to a given controller function
 * The controller funtion will be passed an object with the route and templateID
 *
 *  Basic usage:
 * _router.when('/',{templateID:'test', controller:function(obj) {
      console.log('Running route: '+obj.route+', with template: '+obj.templateID);
    }});
 *
 * @param route
 * @param config
 */
export function when(route, config) {
  _routeMap[route] = {
    templateID: config.templateID,
    controller: config.controller
  };
}

/**
 * Runs the route currently on the URL
 * Primarily used window.load
 */
export function runCurrentRoute() {
  var current = getCurrentRoute();
  runRoute(current.route, current.data);
}

/**
 * Executes the controller function for the given route
 * @param route
 * @param queryStrObj
 */
export function runRoute(route, queryStrObj) {
  var routeObj = _routeMap[route];

  if (routeObj) {
    routeObj.controller.call(window, {
      route     : route,
      templateID: routeObj.templateID,
      data      : queryStrObj
    });
  } else {
    console.log('No Route mapped for: "' + route + '"');
  }
}