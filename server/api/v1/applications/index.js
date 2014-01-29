/**
 * Anonymous Applications
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , school = require('../../../models/school')
  , application = require('../../../models/application')
  , card = require('../../../models/card');
/**
 *
 */
api.get('/:applicationId/schools/:schoolId', function(req, res) {
  var applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).exec(function(err, School) {
    if (!_.contains(School.applications, applicationId)) {
      res.json({});
      return;
    }
    application.findById(applicationId, function(err, Application) {
      card.find({"owners.applications": applicationId}, function(err, Cards) {
        res.json({
          applicationId: applicationId,
          application: Application,
          schoolId: schoolId,
          school: School,
          cards: Cards
        });
      });
    });
  });
});
module.exports = api;
