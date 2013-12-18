/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore');
/**
 *
 */
var options = require('../../../options')
api.options('/*', options);
/**
 *
 */
api.get('/', function(req, res) {
  res.json({});
});
/**
 *
 */
var authenticate = require('./authenticate');
api.use('/authenticate', authenticate);
/**
 *
 */
var students = require('./students');
api.use('/students/', students);
/**
 *
 */
module.exports = api;