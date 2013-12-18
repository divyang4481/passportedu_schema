/**
 *
 */
var express = require('express')
  , api = express();
/**
 *
 */
api.get('/:studentId/applications', function(req, res) {
  res.json({});
});
/**
 *
 */
module.exports = api;