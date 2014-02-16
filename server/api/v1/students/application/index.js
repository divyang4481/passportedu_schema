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
  getApplicationCards(studentId).then(function(response) {
    application.findById(applicationId)
      .exec(function(err, Application) {
        user.findById(studentId).exec(function(err, Student) {
          school.findById(schoolId).exec(function(err, School) {
            var feesPaid = _.where(Student.feesPaid, {applicationId: applicationId}).length;
            response.feesPaid = feesPaid;
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
  });
};
/**
 *
 */
var getApplicationCards = function(studentId) {
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
        getApplicationCards(studentId).then(function(response) {
          response.username = req.username;
          response.token = req.token;
          res.json(response);
        });
      });
    });
  } else {
    card.update({_id: cardId}, cardPost, function(err, affected, Card) {
      getApplicationCards(studentId).then(function(response) {
        response.username = req.username;
        response.token = req.token;
        res.json(response);
      });
    });
  }
};
/**
 * Charging the application fee, stored in the application model
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
          amount: (Application.fee * 100),
          currency: "usd",
          card: stripeToken.id,
          description: Student.fullName + ' ' + Student.username + ' appId:' + applicationId
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
            Student.feesPaid.push(
              {
                charge: charge,
                applicationId: applicationId
              }
            );
            Student.markModified('feesPaid');
            Student.save(function(err) {
              res.set('Location', '/api/v1/students/' + studentId + '/schools/' + schoolId + '/applications/' + applicationId + '/paid');
              res.send(300, {username: req.username, token: req.token});
            });
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
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  getApplicationCards(studentId).then(function(response) {
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
 * Failed paying fee
 */
studentApplication.failedFee = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId
    , applicationId = req.params.applicationId;
  getApplicationCards(studentId).then(function(response) {
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
module.exports = studentApplication;