/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , q = require('q')
  , awsUpload = require('../../../../../servers/aws-upload')
var studentApplication = {};
/**
 *
 */
studentApplication.get = function(req, res) {
  var studentId = req.params.studentId;
  getApplication(studentId).then(function(response) {
    response.username = req.username;
    response.token = req.token;
    res.json(response);
  });
};
/**
 *
 */
var getApplication = function(studentId) {
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
studentApplication.cards = {};
studentApplication.cards.put = function(req, res) {
  var studentId = req.params.studentId
    , cardId = req.params.cardId
    , cardPost = _.omit(req.body, '_id');
  if (cardPost.data.file) {
    awsUpload.uploadImage(cardPost.data.file, studentId).then(function(s3FilePath) {
      cardPost.data.file = s3FilePath;
      card.update({_id: cardId}, cardPost, function(err, affected, Card) {
        getApplication(studentId).then(function(response) {
          response.username = req.username;
          response.token = req.token;
          res.json(response);
        });
      });
    });
  } else {
    card.update({_id: cardId}, cardPost, function(err, affected, Card) {
      getApplication(studentId).then(function(response) {
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
studentApplication.cards.delete = function(req, res) {
  var studentId = req.params.studentId
    , cardId = req.params.cardId;
  card.findOneAndRemove({_id: cardId}, function(err) {
    res.set('Location', '/api/v1/students/' + studentId + '/application');
    res.send(300, {username: req.username, token: req.token});
  });
};
module.exports = studentApplication;