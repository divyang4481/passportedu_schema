/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , card = require('../../../models/card')
  , application = require('../../../models/application')
  , school = require('../../../models/school')
  , queryM = require('../../../verbs/query');
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
    req.studentId = auth.user.userId;
    next();
  });
});
/**
 * Students Area
 */
api.get('/', function(req, res) {
  if (res.statusCode === 401) {
    res.set('Location', '/api/v1/students/register');
    res.send(300);
  } else {
    res.set('Location', '/api/v1/students/' + req.studentId);
    res.send(300);
  }
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
  req.query.studentId = studentId;
  queryM(application)(req, function(err, applications) {
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
      applicationId: applicationId,
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
  application.findOneAndRemove(applicationId, function(err) {
    res.set('Location', '/api/v1/students/' + studentId + '/applications');
    res.send(300);
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId/schools', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId;
  application.findById(applicationId).exec(function(err, App) {
    school.find({_id: { $in: App.schoolIds}}).exec().then(function(schools) {
      res.json({
        studentId: studentId,
        applicationId: applicationId,
        schools: schools
      });
    });
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId/searchSchools', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId;
  queryM(school)(req, function(err, Schools) {
    res.json({
      studentId: studentId,
      applicationId: applicationId,
      schools: Schools
    });
  });
});
/**
 *
 */
api.put('/:studentId/applications/:applicationId/schools', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , schoolId = req.body.schoolIds;
  application.findById(applicationId).exec(function(err, App) {
    App.schoolIds = _.union(App.schoolIds, [schoolId]);
    App.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId + '/schools/' + schoolId);
      res.send(300);
    });
  });
});
/**
 *
 */
api.get('/:studentId/applications/:applicationId/schools/:schoolId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).exec().then(function(School) {
    res.json({
      studentId: studentId,
      applicationId: applicationId,
      schoolId: schoolId,
      school: School
    });
  });
});
/**
 *
 */
api.delete('/:studentId/applications/:applicationId/schools/:schoolId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  application.findById(applicationId).exec(function(err, App) {
    App.schoolIds = _.reject(App.schoolIds, function(Id) {
      return Id === schoolId;
    });
    App.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId + '/schools');
      res.send(300);
    });
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
  cardBody.mediaTypes = [req.body.mediaTypes];
  cardBody.data = JSON.parse(req.body.data);
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
      card: Card
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
    res.send(300);
  });
});
/**
 *
 */
api.delete('/:studentId/applications/:applicationId/cards/:cardId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  card.findOneAndRemove({_id: cardId}, function(err) {
    res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId + '/cards');
    res.send(300);
  });
});
/**
 *
 */
module.exports = api;