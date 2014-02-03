var _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , user = require('../../../models/user')
/**
 * Authentication Middleware
 */
var auth = function(req, res, next) {
  var authToken = req.get('Token');
  if (authToken) {
    authenticate.auth(req, res, authToken, function(err, authorization) {
      var studentId = req.params.studentId;
      if ((err)
        || (authorization.user.userType !== 'students')
        || (!_.isUndefined(studentId) && studentId !== authorization.user.userId.toString())) {
        res.set('Location', '/api/v1/students/login');
        res.send(300);
        return;
      }
      user.count({schools: {$in: authorization.user.schools}},
        function(err, countApplicants) {
          req.admissionsId = authorization.user.userId.toString();
          req.username = authorization.user.username;
          req.token = authorization.user.token; // Token needs to be sent back and forth always
          res.header('X-Intercom-Custom', JSON.stringify({
            "userType": authorization.user.userType,
            "schools": authorization.user.schools.length,
            "applications": authorization.user.applications.length,
            "applicants": countApplicants
          }));
          next();
        });
    });
  } else {
    res.set('Location', '/api/v1/students/login');
    res.send(300);
  }
};
module.exports = auth;