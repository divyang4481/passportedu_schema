/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , user = require('../../../models/user')
  , card = require('../../../models/card')
  , application = require('../../../models/application')
  , school = require('../../../models/school')
  , queryM = require('../../../verbs/query');
/**
 *
 */
api.use(function(req, res, next) {
  // All deeper URL's require authentication
  authenticate.auth(req, function(err, auth) {
    // Allowing unauthenticated users to remain in public students area...landing page
    if (req.originalUrl === '/api/v1/students') {
      req.studentsId = auth.user.userId;
      next();
      return;
    }
    if ((err) || (auth.user.userType !== 'students')) {
      res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
      res.send(401);
      return;
    }
    req.studentsId = auth.user.userId;
    next();
  });
});
/**
 * Students Area
 */
api.get('/', function(req, res) {
  if (_.isUndefined(req.studentsId)) {
    res.json({});
  } else {
    res.set('Location', '/api/v1/students/' + req.studentsId);
    res.send(300);
  }
});
/**
 * Students Area
 */
api.get('/login', function(req, res) {
  if (_.isUndefined(req.studentsId)) {
    res.set('Location', '/api/v1/students');
    res.send(300);
  } else {
    res.set('Location', '/api/v1/students/' + req.studentsId);
    res.send(300);
  }
});
/**
 *
 */
api.get('/:studentId', function(req, res) {
  var studentId = req.params.studentId;
  var response = {
    studentId: studentId
  };
  user.find()
    .select('-_id, -__v, -username, -password, -token, -userPerms')
    .where({_id: studentId})
    .exec(function(err, Student) {
      response.student = Student[0];
      console.log(Student);
      school.find({_id: { $in: Student[0].schoolIds}}, function(err, Schools) {
        console.log(err);
        response.schools = Schools;
        res.json(response);
      });
    });
});
/**
 *
 */
api.get('/:studentId/schools/:schoolId', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).exec().then(function(School) {
    var response = {
      studentId: studentId,
      schoolId: schoolId,
      school: School
    }
    res.json(response);
  });
});
/**
 *
 */
api.delete('/:studentId/schools/:schoolId', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  user.findById(studentId, function(err, Student) {
    Student.schoolIds = _.reject(Student.schoolIds, function(Id) {
      return Id === schoolId;
    });
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId);
      res.send(300);
    });
  });
});
/**
 *
 */
api.get('/:studentId/search/schools', function(req, res) {
  queryM(school)(req, function(err, response) {
    response.studentId = req.params.studentId;
    res.json(response);
  });
});
/**
 *
 */
api.get('/:studentId/search/schools/:schoolId', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).exec().then(function(School) {
    var response = {
      studentId: studentId,
      schoolId: schoolId,
      school: School
    }
    res.json(response);
  });
});
/**
 *
 */
api.put('/:studentId/search/schools/:schoolId/apply', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  user.findById(studentId).exec(function(err, Student) {
    Student.schoolIds = _.union(Student.schoolIds, [schoolId]);
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId);
      res.send(300);
    });
  });
});
/**
 *
 */
api.put('/:studentId/search/schools/:schoolId/save', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  user.findById(studentId).exec(function(err, Student) {
    Student.schoolIds = _.union(Student.schoolIds, [schoolId]);
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId + '/search/schools/' + schoolId);
      res.send(300);
    });
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
api.post('/:studentId/applications/:applicationId/cards', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , cardBody = req.body;
  cardBody.owners = [];
  cardBody.owners.push({application: applicationId});
  cardBody.owners.push({student: studentId});
  cardBody.mediaType = req.body.mediaType;
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