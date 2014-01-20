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
api.get('/:applicationId/schools/:schoolId', function(req, res) {
  var applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  application.findById(applicationId, function(err, Application) {
    card.find({"owners.applications": applicationId}, function(err, Cards) {
      res.json({
        applicationId: Application._id.toString(),
        application: Application,
        schoolId: schoolId,
        cards: Cards
      });
    });
  });
});
module.exports = api;
