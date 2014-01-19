/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , user = require('../../../../models/user');
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
  var admissions = req.body;
  admissions.userPerms = ['admissions'];
  admissions.created = Math.round(new Date().getTime() / 1000);
  user.create(admissions, function(err, Admissions) {
    if (err) {
      res.json({
        error: err
      });
    } else {
      res.set('Location', '/api/v1/admissions/' + Admissions._id);
      res.send(300);
    }
  });
});
module.exports = api;