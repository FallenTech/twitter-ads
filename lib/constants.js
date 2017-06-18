exports = module.exports = {
  API_HOST: 'https://ads-api.twitter.com/',
  API_SANDBOX_HOST: 'https://ads-api-sandbox.twitter.com/',
  TON_API_HOST: 'https://ton.twitter.com/',
  CONFIGURABLE_KEYS: ['api_version', 'ton_api_version', 'sandbox', 'consumer_key', 'consumer_secret', 'access_token', 'access_token_secret'],
  REQUIRED_KEYS: ['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret'],
  REQUIRED_TON_UPLOAD_PARAMS: ['file', 'content_type', 'bucket_name'],
  REQUIRED_TON_DOWNLOAD_PARAMS: ['file', 'url'],
  STATUS_CODES_TO_ABORT_ON: [400, 401, 403, 404, 406, 410, 413, 422],
  JSON_PATHS: ['tailored_audience_memberships']
};