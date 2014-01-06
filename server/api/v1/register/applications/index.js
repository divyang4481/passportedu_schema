/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , user = require('../../../../models/user')
  , application = require('../../../../models/application');
/**
 *
 */
api.get('/', function(req, res) {
  res.json({});
});
/**
 *
 */
api.post('/:applicationId', function(req, res) {
  var student = req.body.student
    , cards = req.body.cards
    , Student = new user(student);
  Student.userPerms = ['students'];
  Student.save(function(err) {
    _.each(cards, function(cardLink) {
      var cardBody = {};
      cardBody.data = cardLink.data;
      cardBody.type = cardLink.type;
      cardBody.owners = [];
      cardBody.owners.push({students: Student._id});
      var Card = new card(cardBody);
      card.save();
    });
    if (err) {
      res.json({
        error: err
      });
    } else {
      res.set('Location', '/api/v1/applications/' + Student._id);
      res.send(300);
    }
  });
});
module.exports = api;