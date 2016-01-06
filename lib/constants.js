exports = module.exports = {
  API_HOST: 'https://ads-api.twitter.com/',
  API_SANDBOX_HOST: 'https://ads-api-sandbox.twitter.com/',
  CONFIGURABLE_KEYS: ['api_version', 'sandbox', 'consumer_key', 'consumer_secret', 'access_token', 'access_token_secret'],
  REQUIRED_KEYS: ['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret'],
  STATUS_CODES_TO_ABORT_ON: [400, 401, 403, 404, 406, 410, 422]
};