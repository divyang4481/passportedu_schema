/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , user = require('../../../../models/user')
  , authenticate = require('../../../../helpers/authenticate')
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
    , cards = req.body.cards
    , applicationId = req.params.applicationId;
  student.userPerms = ['students'];
  student.applications = [applicationId];
  student.schools = [req.params.schoolId];
  student.created = Math.round(new Date().getTime() / 1000);
  user.create(student, function(err, Student) {
    if (err) {
      res.json({
        error: err
      });
      return;
    };
    var studentId = Student._id.toString();
    _.each(cards, function(postCard) {
      var Card = {};
      Card.data = postCard.data;
      Card.owners = {
        students: studentId
      };
      Card.order = postCard.order;
      Card.type = postCard._link.type;
      card.create(Card, function(err, newCard) {
        Student.cards.push(newCard._id.toString());
        Student.save(function(err) {
          console.log(err, newCard, Student);
        });
      });
    });
    if (err) {
      res.json({
        error: err
      });
    } else {
      authenticate.login(req, res, req.body.student.username, req.body.student.password,
        function(err, authorization) {
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
module.exports = api;