/**
 * Anonymous Applications
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , application = require('../../../models/application')
  , card = require('../../../models/card');
/**
 *
 */
api.get('/:applicationId', function(req, res) {
  var applicationId = req.params.applicationId;
  application.findById(applicationId, function(err, Application) {
    card.find({owners: {application: applicationId}}, function(err, Cards) {
      res.json({
        applicationId: Application._id,
        application: Application,
        cards: Cards
      });
    });
  });
});
module.exports = api;