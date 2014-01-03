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
var students = require('./students');
api.use('/students/', students);
/**
 *
 */
var admissions = require('./admissions');
api.use('/admissions/', admissions);
/**
 *
 */
module.exports = api;