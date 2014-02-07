/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , school = require('../../../../models/school')
  , q = require('q');
/**
 *
 */
var studentSchools = {
  school: {}
};
/**
 *
 */
studentSchools.school.get = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .exec(function(err, School) {
      user.find()
      var response = {
        studentId: studentId,
        schoolId: schoolId,
        school: School
      };
      response.username = req.username;
      response.token = req.token;
      res.json(response);
    });
};
/**
 *
 */
studentSchools.school.payApplicationFee = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  console.log(req.body.stripeToken);
  res.set('Location', '/api/v1/students/' + studentId + '/schools/' + schoolId);
  res.send(300, {username: req.username, token: req.token});
};
/**
 *
 */
studentSchools.school.delete = function(req, res) {
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
};
/**
 *
 */
studentSchools.school.apply = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  user.findById(studentId).exec(function(err, Student) {
    Student.schools = _.union(Student.schools, [schoolId]);
    Student.applications = _.union(Student.applications, [applicationId]);
    addApplicationCardsToStudent(Student, applicationId).then(function() {
      res.set('Location', '/api/v1/students/' + studentId + '/application');
      res.send(300, {username: req.username, token: req.token});
    });
  });
};
/**
 *
 */
studentSchools.school.save = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  user.findById(studentId).exec(function(err, Student) {
    Student.schools = _.union(Student.schools, [schoolId]);
    Student.applications = _.union(Student.applications, [applicationId]);
    addApplicationCardsToStudent(Student, applicationId).then(function() {
      res.json({});
    });
  });
};
/**
 *
 */
var addApplicationCardsToStudent = function(Student, applicationId) {
  var deferred = q.defer();
  /**
   * Find students existing application cards
   */
  card.find({"owners.students": Student._id.toString()}, function(err, studentCards) {
    /**
     * Find Cards for Application
     */
    card.find({'owners.applications': applicationId}, function(err, appCards) {
      this.studentCardTypes = _.map(studentCards, function(card) {
        return card.type;
      });
      this.applicationCardTypes = _.map(appCards, function(card) {
        return card.type;
      });
      this.Student = Student;
      /**
       * Remove each instance of a card student already has from those being added
       */
      var addCards = _.reject(appCards, function(Card) {
        if (_.contains(this.studentCardTypes, Card.type)) {
          var index = _.indexOf(this.studentCardTypes, Card.type);
          this.studentCardTypes.splice(index, 1);
          return true;
        }
        return false;
      }, this);
      /**
       * Update the cards that don't need to be added, but which require an update
       */
      var updateCards = _.filter(studentCards, function(Card) {
        if (_.contains(this.applicationCardTypes, Card.type)) {
          var index = _.indexOf(this.applicationCardTypes, Card.type);
          this.applicationCardTypes.splice(index, 1);
          return true;
        }
        return false;
      }, this);
      /**
       * Add applicationId to owners
       */
      _.each(updateCards, function(Card) {
        if (_.isArray(Card.owners.applications)) {
          Card.owners.applications.push(applicationId);
        } else {
          Card.owners.applications = [applicationId];
        }
        Card.markModified('owners.applications');
        Card.save(function(err, savedDoc) {
          console.log(err, savedDoc);
        });
      });
      /**
       * Add non-existent cards
       */
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
          Student.save(function(err) {
            console.log(err);
          });
        });
      });
      deferred.resolve();
    });
  });
  return deferred.promise;
};
/**
 *
 */
module.exports = studentSchools;