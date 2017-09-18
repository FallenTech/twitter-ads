# Twitter Ads API

[![Build Status](https://travis-ci.org/FallenTech/twitter-ads.svg?branch=master)](https://travis-ci.org/FallenTech/twitter-ads)
[![Dependency Status](https://www.versioneye.com/user/projects/56338d8f36d0ab0021001a8d/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56338d8f36d0ab0021001a8d)
[![NPM version](https://badge.fury.io/js/twitter-ads.svg)](http://badge.fury.io/js/twitter-ads)

[![NPM stats](https://nodei.co/npm/twitter-ads.svg?downloads=true)](https://www.npmjs.org/package/twitter-ads)

A simple wrapper for <a href="https://dev.twitter.com/ads/overview">Twitter Ads & TON API</a> in NodeJS.

## Installation

```
$ npm install twitter-ads
```


## Usage
```js
var TwitterAdsAPI = require('twitter-ads');
var T = new TwitterAdsAPI({
  consumer_key: 'XXX',
  consumer_secret: 'XXX',
  access_token: 'XXX',
  access_token_secret: 'XXX',
  sandbox: false, // defaults to true
  api_version: '2' //defaults to 2
});

T.get('accounts/:account_id', {account_id: 'XXX'}, function(error, resp, body) {
  if (error) return console.error(error);
  console.log(body);
  /* If everything goes okay,
  you should get something similar to this:
  
    {
      data: {
        approval_status: "ACCEPTED",
        created_at: "2014-07-14T22:51:48Z",
        deleted: false,
        id: "hkkd",
        name: "Some person named Emma",
        salt: "973fef8gce1c5d5f6bba4b91827c214a",
        timezone: "America/Los_Angeles",
        timezone_switch_at: "2014-07-27T07:00:00Z",
        updated_at: "2014-08-27T21:59:56Z"
      },
      data_type: "account",
      request: {
        params: {
          account_id: "hkkd"
        }
      }
    }  
  */
  
});

/* Use T.get, T.post, T.put and T.delete
   refer to Twitter API docs for the details on call parameters. */
```

## Twitter TON API
```js
T.tonUpload({
    file: './test.txt',
    content_type: 'text/plain',
    bucket_name: 'ta_partner'
  },
  function(error, location) {
    if (error) return console.error(error);
    console.log(location);
    /* If everything goes okay,
    you should get something similar to this:
      https://ton.twitter.com/1.1/ton/bucket/ta_partner/2892314386/n3UPAcC02roTP6C
    */
});

T.tonDownload({
    file: './test.txt',
    url: 'https://ton.twitter.com/1.1/ton/bucket/ta_partner/2892314386/n3UPAcC02roTP6C'
  },
  function(error, size) {
    if (error) return console.error(error);
    console.log(size);
    /* If everything goes okay,
    you should get something similar to this:
      204923
    */
});
```

## Additional Configurables
* **sandbox (Boolean)** - (Default: true) - Uses sandbox API host.
* **api_version (String)** - (Default: 2) - Ads API version to use.