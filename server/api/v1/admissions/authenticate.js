var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , user = require('../../../models/user')
  , card = require('../../../models/card')
  , application = require('../../../models/application')
  , school = require('../../../models/school')
  , queryM = require('../../../verbs/query')
  , q = require('q');

var auth = function(req, res, next) {
  // All deeper URL's require authentication
  var authToken = req.get('Token');
  if (authToken) {
    authenticate.auth(req, res, authToken, function(err, authorization) {
      var admissionsId = req.params.admissionsId;
      if ((err)
        || (authorization.user.userType !== 'admissions')
        || (!_.isUndefined(admissionsId) && admissionsId !== authorization.user.userId.toString())) {
        res.set('Location', '/api/v1/admissions');
        res.send(300);
        return;
      }
      user.count({schools: {$in: authorization.user.schools}}, function(err, countApplicants) {
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
    res.set('Location', '/api/v1/admissions/login');
    res.send(300);
  }
};
module.exports = auth;