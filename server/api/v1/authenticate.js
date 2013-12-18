/**
 * Authentication API
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../helpers/authenticate');
/**
 * Receive a POSt and use body.username body.password to authenticate user
 */
api.post('/', function(req, res) {
  authenticate.login(req, function(err, response) {
    response = _.extend({}, response);
    if (_.isUndefined(response.token)) {
      response.instructions = "Authenticate with a username and password.";
    } else {
      response.instructions = "base64 encode the username:token and send it in the Token: header with all requests for authentication.";
    }
    res.json(response);
  });
});
/**
 *
 */
module.exports = api;