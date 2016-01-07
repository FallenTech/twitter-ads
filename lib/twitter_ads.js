var util = require('util'),
    request = require('request'),
    helpers = require('./helpers'),
    constants = require('./constants');

function TwitterAdsAPI(options) {
  var self = this;
  
  // Default values
  self.config = {
    api_version: '0',
    sandbox: true,
    consumer_key: null,
    consumer_secret: null,
    access_token: null,
    access_token_secret: null,
  };
  
  self._oauthObj = {};
  
  self._validateConfigOrThrow = function(config) {
    if (config && typeof config !== 'object') throw new TypeError('TwitterAdsAPI: Config must be object, got ' + typeof config);
    
    constants.CONFIGURABLE_KEYS.forEach(function(k) {
      if (config[k] !== undefined) self.config[k] = config[k];
      else if (constants.REQUIRED_KEYS.indexOf(k) > -1) throw new Error(util.format('TwitterAdsAPI: Config must include `%s`.', k));
    });
    
    self._oauthObj = {
      consumer_key: self.config.consumer_key,
      consumer_secret: self.config.consumer_secret,
      token: self.config.access_token,
      token_secret: self.config.access_token_secret,
    };
  };

  if (options) self._validateConfigOrThrow(options);
  
  self._makeRequest = function(type, url, params, cb) {
    if (!url) throw new Error('TwitterAdsAPI: URL must be provided when making an API call.');
    if (typeof params == 'function') {
      cb = params;
      params = {};
    }
    if (!cb) throw new Error('TwitterAdsAPI: Callback must be provided when making an API call.');
    
    // Let's not change the params object user changes.
    var paramsClone = JSON.parse(JSON.stringify(params)),
        finalURL = Object.keys(paramsClone).length? helpers.moveParamsIntoPath(url, paramsClone) : url;

    paramsClone = helpers.normalizeParams(paramsClone);
    request({
      baseUrl: (self.config.sandbox? constants.API_SANDBOX_HOST : constants.API_HOST) + self.config.api_version + '/',
      url: Object.keys(paramsClone).length? finalURL + '?' + helpers.makeQueryString(paramsClone) : finalURL,
      method: type.toUpperCase(),
      //useQuerystring: true,
      //gzip: true,
      oauth: self._oauthObj
    }, function(err, resp, body) {
      if (err) return cb(err);
      helpers.parseResponse(resp, body, cb);
    });
  };
  
  return self;
}

TwitterAdsAPI.prototype.setOptions = function(options) {
  this._validateConfigOrThrow(options);
  return this;
};

TwitterAdsAPI.prototype.getOptions = function() { return this.config; };


TwitterAdsAPI.prototype.get = function(url, params, cb) {
  this._makeRequest('get', url, params, cb);
};

TwitterAdsAPI.prototype.post = function(url, params, cb) {
  this._makeRequest('post', url, params, cb);
};

TwitterAdsAPI.prototype.put = function(url, params, cb) {
  this._makeRequest('put', url, params, cb);
};

TwitterAdsAPI.prototype.delete = function(url, params, cb) {
  this._makeRequest('delete', url, params, cb);
};

exports = module.exports = TwitterAdsAPI;