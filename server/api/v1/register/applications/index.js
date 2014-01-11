/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , user = require('../../../../models/user')
  , application = require('../../../../models/application')
  , card = require('../../../../models/card')
/**
 *
 */
api.get('/', function(req, res) {
  res.json({});
});
/**
 *
 */
api.post('/:applicationId/schools/:schoolId', function(req, res) {
  var student = req.body.student
    , cards = req.body.cards;
  student.userPerms = ['students'];
  student.applicationIds = [req.params.applicationId];
  student.schoolIds = [req.params.schoolId];
  user.create(student, function(err, Student) {
    var studentId = Student._id.toString();
    _.each(cards, function(postCard) {
      var Card = {};
      Card.data = postCard.data;
      Card.owners = postCard.owners;
      Card.type = postCard._link.type;
      Card.owners.students = studentId;
      card.create(Card);
    });
    if (err) {
      res.json({
        error: err
      });
    } else {
      res.set('Location', '/api/v1/students/' + studentId);
      res.send(300);
    }
  });
});
module.exports = api;