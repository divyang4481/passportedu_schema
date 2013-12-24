/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , user = require('../../models/user');
/**
 *
 */
api.get('/', function(req, res) {
  res.json({});
});
/**
 *
 */
api.post('/', function(req, res) {
  var student = req.body;
  var Student = new user(student);
  Student.save(function(err) {
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