/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , card = require('../../../models/card')
  , application = require('../../../models/application')
  , queryM = require('../../../verbs/query');
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
    req.studentId = auth.user.userId;
    next();
  });
});
/**
 * Students Area
 */
api.get('/', function(req, res) {
  res.set('Location', '/api/v1/students/' + req.studentId);
  res.send(300);
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
    res.send(300);
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
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + App._id);
    res.send(300);
  });
});
/**
 *
 */
api.delete('/:studentId/applications/:applicationId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId;
  application.findOneAndRemove(applicationId, function(err, App) {
    res.set('Location', '/api/v1/students/' + studentId + '/applications');
    res.send(300);
  });
});
/**
 *
 */
api.post('/:studentId/applications/:applicationId/cards', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , cardBody = req.body;
  cardBody.owners = [];
  cardBody.owners.push({application: applicationId});
  cardBody.owners.push({student: studentId});
  cardBody.mediaType = [req.body.mediaType];
  var Card = new card(cardBody);
  Card.save(function(err) {
    if (err) {
      res.send(415);
      return;
    }
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId + '/cards/' + Card._id);
    res.send(300);
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId/cards', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId;
  req.query.owners = {application: applicationId};
  queryM(card)(req, function(err, data) {
    var response = {
      studentId: studentId,
      applicationId: applicationId,
      meta: data.meta,
      cards: data.result,
      count: data.count,
      pages: data.pages,
      page: data.page
    };
    res.json(response);
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
      applicationId: applicationId,
      cardId: cardId,
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
module.exports = api;