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
  , queryM = require('../../../verbs/query')
  , q = require('q');
/**
 *
 */
api.use(function(req, res, next) {
  // All deeper URL's require authentication
  var authToken = req.get('Token');
  var authHeader = req.get('Authorization');
  if (authHeader) {
    authenticate.login(req, res, authHeader, function(err, authorization) {
      if (err && req.originalUrl === '/api/v1/students') {
        next();
        return;
      }
      if ((err) || (authorization.user.userType !== 'students')) {
        res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
        res.send(401);
        return;
      }
      req.studentsId = authorization.user.userId;
      req.username = authorization.user.username;
      req.token = authorization.user.token; // Token needs to be sent back and forth always
      res.header('X-Intercom-Custom', JSON.stringify({
        "userType": authorization.user.userType,
        "schools": authorization.user.schools.length,
        "cards": authorization.user.cards.length
      }));
      next();
      return;
    })
  } else if (authToken) {
    authenticate.auth(req, res, authToken, function(err, authorization) {
      // Allowing unauthenticated users to remain in public students area...landing page
      if (err && req.originalUrl === '/api/v1/students') {
        next();
        return;
      }
      if ((err) || (authorization.user.userType !== 'students')) {
        res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
        res.send(401);
        return;
      }
      req.studentsId = authorization.user.userId;
      req.username = authorization.user.username;
      req.token = authorization.user.token; // Token needs to be sent back and forth always
      res.header('X-Intercom-Custom', JSON.stringify({
        "userType": authorization.user.userType,
        "schools": authorization.user.schools.length,
        "cards": authorization.user.cards.length
      }));
      next();
      return;
    });
  } else {
    if (req.originalUrl === '/api/v1/admissions') {
      next();
      return;
    }
    res.set('WWW-Authenticate', 'Basic realm="/api/v1/admissions"');
    res.send(401);
    return;
  }
  return;
});
/**
 * Students Area
 */
api.get('/', function(req, res) {
  if (_.isUndefined(req.studentsId)) {
    res.json({});
  } else {
    res.set('Location', '/api/v1/students/' + req.studentsId);
    res.send(300, {username: req.username, token: req.token});
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
    res.send(300, {username: req.username, token: req.token});
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
  user.findById(studentId)
    .populate('schools')
    .populate('applications')
    .exec(function(err, Student) {
      response.student = Student;
      response.username = req.username;
      response.token = req.token;
      res.json(response);
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
    };
    response.username = req.username;
    response.token = req.token;
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
    Student.schools = _.reject(Student.schools, function(Id) {
      return Id === schoolId;
    });
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId);
      res.send(300, {username: req.username, token: req.token});
    });
  });
});
/**
 *
 */
api.get('/:studentId/search/schools', function(req, res) {
  queryM(school)(req, function(err, response) {
    response.studentId = req.params.studentId;
    response.cardType = 'search/results/schools';
    response.username = req.username;
    response.token = req.token;
    res.json(response);
  });
});
/**
 *
 */
api.get('/:studentId/search/schools/:schoolId', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).populate("applications").exec(function(err, School) {
    var response = {
      studentId: studentId,
      schoolId: schoolId,
      school: School
    };
    response.username = req.username;
    response.token = req.token;
    res.json(response);
  });
});
/**
 *
 */
api.put('/:studentId/schools/:schoolId/application/:applicationId/apply', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  user.findById(studentId).exec(function(err, Student) {
    Student.schools = _.union(Student.schools, [schoolId]);
    Student.applications = _.union(Student.applications, [applicationId]);
    addApplicationCardsToStudent(Student, applicationId);
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId + '/application');
      res.send(300, {username: req.username, token: req.token});
    });
  });
});
/**
 *
 */
api.put('/:studentId/schools/:schoolId/application/:applicationId/save', function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  user.findById(studentId).exec(function(err, Student) {
    Student.schools = _.union(Student.schools, [schoolId]);
    Student.applications = _.union(Student.applications, [applicationId]);
    addApplicationCardsToStudent(Student, applicationId);
    Student.save(function(err) {
      res.json({});
    });
  });
});
/**
 *
 * @param Student
 * @param applicationId
 */
var addApplicationCardsToStudent = function(Student, applicationId) {
  card.find({"owners.students": Student._id.toString()}, function(err, studentCards) {
    card.find({'owners.applications': applicationId}, function(err, appCards) {
      this.studentCardTypes = _.map(studentCards, function(card) {
        return card.type;
      });
      this.Student = Student;
      // Remove each instance of a card student already has from those being added
      var addCards = _.reject(appCards, function(Card) {
        if (_.contains(this.studentCardTypes, Card.type)) {
          var index = _.indexOf(this.studentCardTypes, Card.type);
          this.studentCardTypes.splice(index, 1);
          return true;
        }
        return false;
      }, this);
      _.each(addCards, function(Card) {
        var newCard = {
          owners: {
            students: Student._id.toString()
          },
          type: Card.type,
          order: Card.order,
          data: {}
        };
        card.create(newCard, function(err, Card) {
          Student.cards.push(Card._id.toString());
          Student.save();
        });
      });
    });
  });
};
/**
 *
 */
var getApplication = function(studentId) {
  var deferred = q.defer();
  card.find({"owners.students": studentId}, function(err, Cards) {
    deferred.resolve({
      studentId: studentId,
      cards: Cards
    });
  });
  return deferred.promise;
}
/**
 *
 */
api.get('/:studentId/application', function(req, res) {
  var studentId = req.params.studentId;
  getApplication(studentId).then(function(response) {
    response.username = req.username;
    response.token = req.token;
    res.json(response);
  });
});
/**
 *
 */
api.get('/:studentId/application/cards/:cardId', function(req, res) {
  var studentId = req.params.studentId
    , cardId = req.params.cardId;
  card.findById(cardId).exec(function(err, Card) {
    var response = {
      studentId: studentId,
      cardId: cardId,
      card: Card
    };
    response.username = req.username;
    response.token = req.token;
    res.json(response);
  });
});
/**
 *
 */
api.put('/:studentId/application/cards/:cardId', function(req, res) {
  var studentId = req.params.studentId
    , cardId = req.params.cardId
    , cardPost = _.omit(req.body, '_id');
  card.update({_id: cardId}, cardPost, function(err, affected, Card) {
    getApplication(studentId).then(function(response) {
      response.username = req.username;
      response.token = req.token;
      res.json(response);
    });
  });
});
/**
 *
 */
api.delete('/:studentId/application/cards/:cardId', function(req, res) {
  var studentId = req.params.studentId
    , cardId = req.params.cardId;
  card.findOneAndRemove({_id: cardId}, function(err) {
    res.set('Location', '/api/v1/students/' + studentId + '/application');
    res.send(300, {username: req.username, token: req.token});
  });
});
/**
 *
 */
module.exports = api;