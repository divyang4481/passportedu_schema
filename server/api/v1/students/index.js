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
    console.log(auth);
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
      studentId: studentId,
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
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + app._id);
    res.send(302);
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId;
  application.findById(applicationId).exec(function(err, App) {
    res.json({
      studentId: studentId,
      applicationId: App._id,
      application: _.omit(App, ['_id'])
    });
  });
});
/**
 *
 */
api.put('/:studentId/applications/:applicationId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , appPost = req.body;
  application.findOneAndUpdate(applicationId, appPost, function(err, App) {
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + app._id);
    res.send(302);
  });
});
/**
 *
 */
api.post('/:studentId/applications/:applicationId/cards', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , appBody = req.body;
  appBody.owners = [];
  appBody.owners.push({application: applicationId});
  appBody.owners.push({student: studentId});
  var Card = new card(appBody);
  Card.save(function(err) {
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId + '/cards/' + Card._id);
    res.send(302);
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId/cards', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  card.find({owners: {application: applicationId}}).exec(function(err, Cards) {
    res.json({
      studentId: studentId,
      applicationId: applicationId._id,
      cards: Cards
    });
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId/cards/:cardId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  card.findById(cardId).exec(function(err, Card) {
    res.json({
      studentId: studentId,
      applicationId: applicationId._id,
      cardId: Card._id,
      card: _.omit(Card, ['_id'])
    });
  });
});
/**
 *
 */
api.put('/:studentId/applications/:applicationId/cards/:cardId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId
    , cardPost = req.body;
  card.findOneAndUpdate(cardId, cardPost, function(err, Card) {
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId + '/cards/' + Card._id);
    res.send(302);
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