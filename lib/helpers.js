var querystring = require('querystring'),
    constants = require('./constants'),
    helpers = {};

// Adhere to RFC 3986 (which reserves !, ', (, ), and *)
function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

helpers.makeQueryString = function(obj) {
  var nodeVersionParts = process.versions.node.split('.');
  
  if (nodeVersionParts[1] === '10') { // Node <= 0.10.x version (No encodeURIComponent overriding) ...
    return querystring.stringify(obj).replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  } else return querystring.stringify(obj, null, null, {encodeURIComponent: fixedEncodeURIComponent});
};

// For each /:param fragment in path, move the value from params
helpers.moveParamsIntoPath = function(path, params) {
  var rgxParam = /\/:(\w+)/g;
  var missingParamErr = null;
  path = path.replace(rgxParam, function(hit) {
    var paramName = hit.slice(2);
    if (!params[paramName]) throw new Error('Twitter-Ads: Params object is missing a required parameter for this request: `' + paramName + '`');
    var retVal = '/' + params[paramName];
    delete params[paramName];
    return retVal;
  });
  return path;
};

helpers.normalizeParams = function(params) {
  var normalized = params ? params : {};
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(function(k) {
      if (Array.isArray(params[k])) normalized[k] = params[k].join(',');
    });
  }
  return normalized;
};

helpers.tryJSONParse = function(body) {
  var ret = body;
  try {
    ret = JSON.parse(body);
  } catch (e) {}
  return ret;
};

helpers.parseResponse = function(resp, body, cb) {
  var parsedBody;
  if (body && typeof body === 'object') parsedBody = body;
  else if (body && resp.headers['content-type'].indexOf('application/json') > -1 && typeof body === 'string') parsedBody = helpers.tryJSONParse(body);
  if (constants.STATUS_CODES_TO_ABORT_ON.indexOf(resp.statusCode) > -1 || (parsedBody && parsedBody.errors && parsedBody.errors.length)) {
    var err = new Error('Bad status code returned: ' + resp.statusCode + '\nTwitter Replied: ' + body.toString());
    err.allErrors = [];
    if (parsedBody && parsedBody.errors && parsedBody.errors.length) {
      err.allErrors = parsedBody.errors;
      err.message = 'Twitter-Ads API Error: ' + parsedBody.errors[0].message;
    }
    return cb(err, resp, parsedBody || body);
  }
  return cb(null, resp, parsedBody || body);
};

exports = module.exports = helpers;