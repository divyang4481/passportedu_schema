var _ = require('underscore');
var authenticate = require('../../../helpers/authenticate');
module.exports = function(req, res) {
  authenticate.login(req, function(err, response) {
    response = _.extend({}, response);
    if (_.isUndefined(response.token)) {
      response.instructions = "Authenticate with a username and password.";
    } else {
      response.instructions = "base64 encode the username:token and send it in the Token: header with all requests for authentication.";
    }
    res.json(response);
  });
}