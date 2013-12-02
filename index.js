/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , resting_mongoose = require('resting-mongoose')

var app = express();
app.set('port', 8080);
app.use('/', resting_mongoose(__dirname + '/models', '/api/v1.0'));

http.createServer(app).listen(app.get('port'), function() {
  console.log('Passport API JSON-Schema Spec Server listening on port ' + app.get('port'));
});