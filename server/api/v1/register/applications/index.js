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
  student.applications = [req.params.applicationId];
  student.schools = [req.params.schoolId];
  student.created = Math.round(new Date().getTime() / 1000);
  user.create(student, function(err, Student) {
    var studentId = Student._id.toString();
    _.each(cards, function(postCard) {
      var Card = {};
      Card.data = postCard.data;
      Card.owners = {students: studentId};
      Card.order = postCard.order;
      Card.type = postCard._link.type;
      Card.owners.students = studentId;
      card.create(Card, function(err, newCard) {
        Student.cards.push(newCard._id.toString());
        Student.save();
      });

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