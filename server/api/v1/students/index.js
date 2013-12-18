/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , card = require('../../../models/card')
  , application = require('../../../models/application')

/**
 *
 */
api.use(function(req, res, next) {
  authenticate.auth(req, function(err, auth) {
    if ((err) || (auth.user.userType !== 'students')) {
      res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
      res.send(401);
      return;
    }
    next();
  });
});
/**
 *
 */
api.get('/:studentId/applications', function(req, res) {
  var studentId = req.params.studentId;
  application.rest({studentId: studentId}, function(err, applications) {
    res.json({
      applications: applications
    });
  });
});
/**
 *
 */
api.post('/:studentId/applications', function(req, res) {
  var studentId = req.params.studentId;
  var app = new application({studentId: studentId});
  app.save(function(err) {
    res.json({
      studentId: studentId,
      application: app
    });
  });
});
/**
 *
 */
api.get('/:studentId', function(req, res) {
  var response = {
    studentId: req.params.studentId
  };
  card.find({ownerId: req.params.studentId}, function(cards) {
    response.cards = cards;
    res.json(response);
  });
});

/**
 *
 */
module.exports = api;