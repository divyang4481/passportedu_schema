/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , school = require('../../../../models/school')
  , application = require('../../../../models/application')
  , q = require('q')
  , awsUpload = require('../../../../../servers/aws-upload')
  , config = require('config')
  , stripe = require('stripe')(config.stripe.secret_key)
/**
 *
 */
var studentApplication = {
  cards: {}
};
/**
 *
 */
studentApplication.get = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  getApplicationCard(studentId).then(function(response) {
    application.findById(applicationId)
      .exec(function(err, Application) {
        school.findById(schoolId).exec(function(err, School) {
          response.username = req.username;
          response.token = req.token;
          response.applicationId = applicationId;
          response.schoolId = schoolId;
          response.application = Application;
          response.school = School;
          res.json(response);
        });
      });
  });
};
/**
 *
 */
var getApplicationCard = function(studentId) {
  var deferred = q.defer();
  user.findById(studentId).populate('cards').exec(function(err, Student) {
    deferred.resolve({
      studentId: studentId,
      cards: Student.cards
    })
  });
  return deferred.promise;
};
/**
 *
 */
studentApplication.cards.put = function(req, res) {
  var studentId = req.params.studentId
    , cardId = req.params.cardId
    , cardPost = _.omit(req.body, '_id');
  if (cardPost.data.file) {
    awsUpload.uploadImage(cardPost.data.file, studentId).then(function(s3FilePath) {
      cardPost.data.file = s3FilePath;
      card.update({_id: cardId}, cardPost, function(err, affected, Card) {
        getApplicationCard(studentId).then(function(response) {
          response.username = req.username;
          response.token = req.token;
          res.json(response);
        });
      });
    });
  } else {
    card.update({_id: cardId}, cardPost, function(err, affected, Card) {
      getApplicationCard(studentId).then(function(response) {
        response.username = req.username;
        response.token = req.token;
        res.json(response);
      });
    });
  }
};
/**
 *
 */
studentApplication.payApplicationFee = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  user.findById(studentId, function(err, Student) {
    application.findById(applicationId)
      .exec(function(err, Application) {
        stripe.setApiKey(Application.stripe.access_token);
        var stripeToken = req.body.token;
        var charge = stripe.charges.create({
          amount: 1000,
          currency: "usd",
          card: stripeToken.id,
          description: Student.fullName + ' ' + Student.email
        }, function(err, charge) {
          if (err) {
            if (err.type === 'StripeCardError') {
              // The card has been declined
              res.set('Location', '/api/v1/students/' + studentId + '/schools/' + schoolId + '/applications/' + applicationId + '/fail');
              res.send(300, {username: req.username, token: req.token});
            }
            else {
              // The card has been declined
              res.set('Location', '/api/v1/students/' + studentId + '/schools/' + schoolId + '/applications/' + applicationId + '/systemError');
              res.send(300, {username: req.username, token: req.token});
            }
          } else {
            res.set('Location', '/api/v1/students/' + studentId + '/schools/' + schoolId + '/applications/' + applicationId + '/paid');
            res.send(300, {username: req.username, token: req.token});
          }
        });
      });
  })
};
/**
 * Successfully paid fee
 */
studentApplication.paidFee = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .populate('applications')
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
 * Failed paying fee
 */
studentApplication.failedFee = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .populate('applications')
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
module.exports = studentApplication;