/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , mongoose = require('mongoose');
// Mongoose
mongoose.connect('mongodb://localhost/psprt');
/**
 * Express
 */
var app = express();
app.set('port', 8080);
//app.use(express.logger());
/**
 * Static resources
 */
var coreAssets = __dirname + '/client';
app.use(express.static(coreAssets));
/**
 * API
 */
app.use(express.json());
app.use(express.urlencoded());
/**
 * Resources
 */
var card = require('./server/models/card');
var user = require('./server/models/user');
var application = require('./server/models/application');
var school = require('./server/models/school');
var rest = require('./server/rest');
app.use('/api/v1/resources/users', rest(user));
app.use('/api/v1/resources/cards', rest(card));
app.use('/api/v1/resources/schools', rest(school));
app.use('/api/v1/resources/applications', rest(application));
/**
 * Hypermedia API
 */
app.use('/api/v1', require('./server/api/v1'));
/**
 * Start Server
 */
http.createServer(app).listen(app.get('port'), function() {
  console.log('Listening on port ' + app.get('port'));
});
