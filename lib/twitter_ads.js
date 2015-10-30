var util = require('util'),
    request = require('request'),
    helpers = require('./helpers'),
    constants = require('./constants');

function TwitterAds(options) {
  var self = this;
  
  // Default values
  this.config = {
    api_version: '0',
    sandbox: true,
    consumer_key: null,
    consumer_secret: null,
    access_key: null,
    access_secret: null,
  };
  
  this._oauthObj = {};
  
  if (options) this._validateConfigOrThrow(options);
  
  this._makeRequest = function(type, url, params, cb) {
    if (!url) {
      var err = new Error('Twitter-Ads: URL must be provided when making an API call.');
      throw err;
    }
    if (typeof params == 'function') {
      cb = params;
      params = {};
    }
    if (!cb) {
      var err = new Error('Twitter-Ads: Callback must be provided when making an API call.');
      throw err;
    }
    
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
  
  return this;
}

TwitterAds.prototype.setAuth = function(authConfig) {
  this._validateConfigOrThrow(authConfig);
  return this;
};

TwitterAds.prototype.getAuth = function() { return this.authConfig; };

TwitterAds.prototype._validateConfigOrThrow = function(config) {
  if (config && typeof config !== 'object') throw new TypeError('Twitter-Ads: Config must be object, got ' + typeof config);
  var self = this;
  
  constants.REQUIRED_FOR_USER_AUTH.forEach(function(k) {
    if (config[k]) self.config[k] = config[k];
    else throw new Error(util.format('Twitter-Ads: Config must include `%s`.', k));
  });
  
  this._oauthObj = {
    consumer_key: this.config.consumer_key,
    consumer_secret: this.config.consumer_secret,
    token: this.config.access_token,
    token_secret: this.config.access_token_secret,
  };
}

TwitterAds.prototype.get = function(url, params, cb) {
  this._makeRequest('get', url, params, cb);
};

TwitterAds.prototype.post = function(url, params, cb) {
  this._makeRequest('post', url, params, cb);
};

TwitterAds.prototype.put = function(url, params, cb) {
  this._makeRequest('put', url, params, cb);
};

TwitterAds.prototype.delete = function(url, params, cb) {
  this._makeRequest('delete', url, params, cb);
};

exports = module.exports = TwitterAds;