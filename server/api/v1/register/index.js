/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore');
/**
 *
 */
api.get('/', function(req, res) {
  res.json({});
});
/**
 *
 */
var applications = require('./applications');
api.use('/applications/', applications);
/**
 *
 */
module.exports = api;