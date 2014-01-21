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
 * Register and Login Package
 */
api.get('/', function(req, res) {
  res.json({});
});
api.get('/register', function(req, res) {
  res.json({});
});
api.post('/register', function(req, res) {
  var students = req.body;
  students.userPerms = ['students'];
  students.created = Math.round(new Date().getTime() / 1000);
  user.create(students, function(err, Student) {
    if (err) {
      res.json({
        error: err
      });
    } else {
      authenticate.login(req, res, req.body.username, req.body.password, function(err, authorization) {
        if (err || authorization.user.userType !== 'students') {
          res.set('Location', '/api/v1/students/register');
          res.send(300);
          return;
        }
        res.set('Location', '/api/v1/students/' + authorization.user.userId);
        res.send(300);
      });
    }
  });
});
api.get('/login', function(req, res) {
  res.json({});
});
api.post('/login', function(req, res) {
  console.log(req.body.username, req.body.password);
  authenticate.login(req, res, req.body.username, req.body.password, function(err, authorization) {
    if (err || authorization.user.userType !== 'students') {
      res.set('Location', '/api/v1/students/register');
      res.send(300);
      return;
    }
    res.set('Location', '/api/v1/students/' + authorization.user.userId);
    res.send(300);
  });
});
/**
 * Authentication Middleware
 */
var auth = function(req, res, next) {
  // All deeper URL's require authentication
  var authToken = req.get('Token');
  if (authToken) {
    authenticate.auth(req, res, authToken, function(err, authorization) {
      if ((err) || (authorization.user.userType !== 'students')) {
        res.set('Location', '/api/v1/students/login');
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
    res.set('Location', '/api/v1/students/login');
    res.send(300);
  }
};
api.get('/logout', function(req, res) {
  authenticate.logout(req, function(err, auth) {
    res.set('Location', '/api/v1/students/login');
    res.send(300);
  });
});
/**
 *
 */
api.get('/:studentId', auth, function(req, res) {
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
api.get('/:studentId/schools/:schoolId', auth, function(req, res) {
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
api.delete('/:studentId/schools/:schoolId', auth, function(req, res) {
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
api.get('/:studentId/search/schools', auth, function(req, res) {
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
api.get('/:studentId/search/schools/:schoolId', auth, function(req, res) {
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
api.put('/:studentId/schools/:schoolId/application/:applicationId/apply', auth, function(req, res) {
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
api.put('/:studentId/schools/:schoolId/application/:applicationId/save', auth, function(req, res) {
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
api.get('/:studentId/application', auth, function(req, res) {
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
api.get('/:studentId/application/cards/:cardId', auth, function(req, res) {
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
api.put('/:studentId/application/cards/:cardId', auth, function(req, res) {
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
api.delete('/:studentId/application/cards/:cardId', auth, function(req, res) {
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