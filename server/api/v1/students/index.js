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
  user.findById(studentId, function(err, Student) {
    console.log(studentId, err, Student)
    response.student = Student;
    school.find({_id: { $in: Student.schoolIds}}, function(err, Schools) {
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
    response.cardType = 'search/results/schools';
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
    application.find({_id: {$in: School.applicationIds}}, function(err, Applications) {
      var response = {
        studentId: studentId,
        schoolId: schoolId,
        school: School,
        applications: Applications
      }
      res.json(response);
    });
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
    Student.schoolIds = _.union(Student.schoolIds, [schoolId]);
    Student.applicationIds = _.union(Student.applicationIds, [applicationId]);
    addApplicationCardsToStudent(Student, applicationId);
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId + '/application');
      res.send(300);
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
    Student.schoolIds = _.union(Student.schoolIds, [schoolId]);
    Student.applicationIds = _.union(Student.applicationIds, [applicationId]);
    addApplicationCardsToStudent(Student, applicationId);
    Student.save(function(err) {
      res.set('Location', '/api/v1/students/' + studentId + '/search/schools/' + schoolId);
      res.send(300);
    });
  });
});
/**
 *
 * @param student
 * @param applicationId
 */
var addApplicationCardsToStudent = function(Student, applicationId) {
  card.find({"owners.students": Student._id.toString()}, function(err, studentCards) {
    card.find({"owners.applications": applicationId}, function(err, appCards) {
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
          data: {}
        };
        card.create(newCard);
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
    res.json({
      studentId: studentId,
      cardId: cardId,
      card: Card
    });
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
    res.send(300);
  });
});
/**
 *
 */
module.exports = api;