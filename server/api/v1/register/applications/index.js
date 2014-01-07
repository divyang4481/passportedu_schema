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
    , cards = req.body.cards
    , Student = new user(student);
  Student.userPerms = ['students'];
  Student.applicationIds = [req.params.applicationId];
  Student.schoolIds = [req.params.schoolId];
  Student.save(function(err) {
    var studentId = Student._id.toString();
    _.each(cards, function(cardLink) {
      var cardBody = {};
      cardBody.data = cardLink.data;
      cardBody.type = cardLink.type;
      cardBody.owners = {};
      cardBody.owners.students = studentId;
      var Card = new card(cardBody);
      Card.save();
    });
    if (err) {
      res.json({
        error: err
      });
    } else {
      res.set('Location', '/api/v1/students/' + Student._id);
      res.send(300);
    }
  });
});
module.exports = api;