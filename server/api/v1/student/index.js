var _ = require('underscore');
var authenticate = require('../../../helpers/authenticate');
module.exports = function(req, res) {
  authenticate.auth(req, function(err, auth) {
    if ((err) || (auth.permission.length === 0) || (!_.contains(auth.permission, 'student'))) {
      res.set('Location', '/api/v1/public/authenticate');
      res.send(303);
    }
    res.json({
      hello: "true"
    });
  });
}