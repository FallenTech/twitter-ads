var util = require('util'),
    fs = require('fs'),
    async = require('async'),
    request = require('request'),
    moment = require('moment'),
    helpers = require('./helpers'),
    constants = require('./constants');

function TwitterAdsAPI(options) {
  var self = this;
  
  // Default values
  self.config = {
    api_version: '2',
    ton_api_version: '1.1',
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
  
  self._makeRequest = function(type, url, params, body, cb) {
    if (!url) throw new Error('TwitterAdsAPI: URL must be provided when making an API call.');
    if (typeof params == 'function') {
      cb = params;
      params = {};
      body = undefined;
    }
    if (typeof body === 'function') {
      cb = body;
      body = undefined;
    }
    if (!cb) throw new Error('TwitterAdsAPI: Callback must be provided when making an API call.');
    
    if (params === null || params === undefined) {
      params = {};
    }
    
    // Let's not change the params object user passes
    var paramsClone = JSON.parse(JSON.stringify(params)),
        finalURL = Object.keys(paramsClone).length ? helpers.moveParamsIntoPath(url, paramsClone) : url;

    paramsClone = helpers.normalizeParams(paramsClone);
    
    if (constants.JSON_PATHS.indexOf(url) > -1 && ['post', 'put'].indexOf(type) > -1) {
      request({
        baseUrl: (self.config.sandbox ? constants.API_SANDBOX_HOST : constants.API_HOST) + self.config.api_version + '/',
        url: Object.keys(paramsClone).length ? finalURL + '?' + helpers.makeQueryString(paramsClone) : finalURL,
        method: type.toUpperCase(),
        json: true,
        body: body,
        oauth: self._oauthObj
      }, function(err, resp, body) {
        if (err) return cb(err);
        helpers.parseResponse(resp, body, cb);
      });
    } else {
      request({
        baseUrl: (self.config.sandbox ? constants.API_SANDBOX_HOST : constants.API_HOST) + self.config.api_version + '/',
        url: Object.keys(paramsClone).length ? finalURL + '?' + helpers.makeQueryString(paramsClone) : finalURL,
        method: type.toUpperCase(),
        //useQuerystring: true,
        //gzip: true,
        oauth: self._oauthObj
      }, function(err, resp, body) {
        if (err) return cb(err);
        helpers.parseResponse(resp, body, cb);
      });
    }
  };
  
  self._uploadTonChunks = function(fd, chunkSize, url, params, cb) {
    var fsStats = fs.fstatSync(fd),
        chunkNum = 1,
        bytesBuffer = new Buffer(chunkSize),
        bytesRead = 0,
        totalBytesRead = 0,
        totalBytes = fsStats.size,
        finalLocation = null;
    
    async.whilst(
      function() {
        return totalBytesRead < totalBytes;
      },
      function(nextChunk) {
        bytesRead = fs.readSync(fd, bytesBuffer, 0, chunkSize, totalBytesRead);
      
        // console.log('Uploading chunk #' + chunkNum + ' (' + totalBytesRead + '-' + ((totalBytesRead + bytesRead) - 1) + '/' + totalBytes + ')');
        
        var headers = {
          'Content-Type': params.content_type,
          'Content-Length': bytesRead,
          'Content-Range': 'bytes ' + totalBytesRead + '-' + ((totalBytesRead + bytesRead) - 1) + '/' + totalBytes
        };
        
        request.put(null, {
          baseUrl: constants.TON_API_HOST,
          url: url,
          body: bytesBuffer,
          headers: headers,
          oauth: self._oauthObj
        }, function(err, resp, body) {
          if (err)
            return nextChunk(err);
          
          if (resp.statusCode !== 308 && resp.statusCode !== 201)
            nextChunk(new Error('Twitter did not accept chunk upload, Should return status code 308 or 201 but instead returned: ' + resp.statusCode));
        
          if (resp.statusCode === 201)
            finalLocation = constants.TON_API_HOST + self.config.ton_api_version + resp.headers.location;
          
          totalBytesRead += bytesRead;
          chunkNum++;
          bytesBuffer = new Buffer(chunkSize);
          nextChunk();
        });
      },
      function(err, result) {
        if (err) {
          fs.closeSync(fd);
          return cb(err);
        }
        
        fs.closeSync(fd);
        cb(null, finalLocation);
      }
    );
  };
  
  self._uploadTonFile = function(params, cb) {
    if (!params) throw new Error('TwitterAdsAPI: Parameters must be provided when making TON API call.');
    if (!cb) throw new Error('TwitterAdsAPI: Callback must be provided when making an API call.');
    
    constants.REQUIRED_TON_UPLOAD_PARAMS.forEach(function(k) {
      if (params[k] === undefined) throw new Error(util.format('TwitterAdsAPI: Parameters must include `%s`.', k));
    });
    
    var defaultExpireTime = moment().utc().add(7, 'days').toDate().toUTCString();
    
    var fd, fsStats;
    
    try {
      fd = fs.openSync(params.file, 'r');
      fsStats = fs.fstatSync(fd);
    } catch (e) {
      return cb(e);
    }
          
    var headers = {
      'Content-Length': 0,
      'Content-Type': params.content_type,
      'X-TON-Content-Type': params.content_type,
      'X-TON-Content-Length': fsStats.size,
      'X-TON-Expires': params.expire_time || defaultExpireTime
    };
    
    request.post({
      url: constants.TON_API_HOST + self.config.ton_api_version + '/ton/bucket/' + params.bucket_name + '?resumable=true',
      headers: headers,
      oauth: self._oauthObj
    }, function(err, resp, body) {
      if (err) return cb(err);
      if (resp.statusCode === 201) {
        var urlPathForChunks = resp.headers.location;
        var minChunkSize = Number(resp.headers['X-TON-Min-Chunk-Size'.toLowerCase()]);
        return self._uploadTonChunks(fd, minChunkSize, urlPathForChunks, params, cb);
      } else {
        fs.closeSync(fd);
        console.log('Error Body: ', body);
        return cb(new Error('TwitterAdsAPI: Twitter TON API returned HTTP status code: ' + resp.statusCode));
      }
    });
  };
  
  self._downloadTonFile = function(params, cb) {
    if (!params) throw new Error('TwitterAdsAPI: Parameters must be provided when making TON API call.');
    if (!cb) throw new Error('TwitterAdsAPI: Callback must be provided when making an API call.');
    
    constants.REQUIRED_TON_DOWNLOAD_PARAMS.forEach(function(k) {
      if (params[k] === undefined) throw new Error(util.format('TwitterAdsAPI: Parameters must include `%s`.', k));
    });
    
    var fd, fsStats;
    
    try {
      fd = fs.openSync(params.file, 'w');
      fsStats = fs.fstatSync(fd);
    } catch (e) {
      return cb(e);
    }
    
    request.post({
      url: params.url,
      oauth: self._oauthObj
    }, function(err, resp, body) {
      if (err) return cb(err);
      if (resp.statusCode === 200) {
        try {
          fs.writeSync(fd, body, 0, 'utf-8');
          fs.closeSync(fd);
          return body.length;
        } catch (e) {
          return cb(e);
        }
      } else {
        fs.closeSync(fd);
        return cb(new Error('TwitterAdsAPI: Twitter TON API returned HTTP status code: ' + resp.statusCode));
      }
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

TwitterAdsAPI.prototype.post = function(url, params, body, cb) {
  this._makeRequest('post', url, params, body, cb);
};

TwitterAdsAPI.prototype.put = function(url, params, body, cb) {
  this._makeRequest('put', url, params, body, cb);
};

TwitterAdsAPI.prototype.delete = function(url, params, cb) {
  this._makeRequest('delete', url, params, cb);
};

TwitterAdsAPI.prototype.tonUpload = function(params, cb) {
  this._uploadTonFile(params, cb);
};

TwitterAdsAPI.prototype.tonDownload = function(params, cb) {
  this._downloadTonFile(params, cb);
};


exports = module.exports = TwitterAdsAPI;