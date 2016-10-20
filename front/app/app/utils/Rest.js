/*eslint no-undef: "error"*/
/*eslint-env node*/

/*
Simple REST call module that returns a promise.
Matt Perkins, hello@mattperkins.me
 */

module.exports.request = (reqObj) => {

  return new Promise((resolve, reject) => {

    let xhr     = new XMLHttpRequest(),
        json    = reqObj.json || false,
        method  = reqObj.method ? reqObj.method.toUpperCase() : 'GET',
        url     = reqObj.url,
        headers = reqObj.headers || [],
        data    = reqObj.calendar || null;

    function handleError(type, message) {
      message = message || '';
      reject(type + ' ' + message);
    }

    xhr.open(method, url, true);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            if (json) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(xhr.responseText);
            }
          } catch (e) {
            handleError('Result', 'Error parsing result. Status: ' + xhr.status + ', Response: ' + xhr.response);
          }
        } else {
          handleError(xhr.status, xhr.statusText);
        }
      }
    };

    xhr.onerror   = function () {
      handleError('Network error');
    };
    xhr.ontimeout = function () {
      handleError('Timeout');
    };
    xhr.onabort   = function () {
      handleError('About');
    };

    headers.forEach(function (headerPair) {
      let prop  = Object.keys(headerPair)[0],
          value = headerPair[prop];
      if (prop && value) {
        xhr.setRequestHeader(prop, value);
      } else {
        console.warn('rest, bad header pair: ', headerPair);
      }
    });

    // set non json header? 'application/x-www-form-urlencoded; charset=UTF-8'
    if (json && method !== "GET") {
      xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    } else if (json && method === "GET") {
      //, text/*
      xhr.setRequestHeader("Accept", "application/json; odata=verbose");  // odata param for Sharepoint
    }

    xhr.send(data);
  });
}