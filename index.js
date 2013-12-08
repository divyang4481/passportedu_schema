/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , rest = require('./server/rest')
  , mongoose = require('mongoose'); // Mongoose
mongoose.connect('mongodb://localhost/psprt');
/**
 * Express
 */
var app = express();
app.set('port', 8080);
/**
 * Static resources
 */
var coreAssets = __dirname + '/client';
app.use(express.static(coreAssets));
/**
 * Resources
 */
var card = require('./server/models/card');
app.use('/api/v1/resources', rest(card));
var user = require('./server/models/user');
app.use('/api/v1/resources', rest(user));
/**
 * API
 */
app.use(express.json());
app.use(express.urlencoded());
var authenticate = require('./server/helpers/authenticate');
app.options('/api*', function(req, res) {
  authenticate.auth(req, function(err, auth) {
    var portal = 'public';
    if (!err) {
      portal = auth.permission[0];
      if (auth.permission.length === 0) {
        portal = 'public';
      }
    }
    var schemaLoc = path.join(__dirname, 'options', 'v1', portal, req.url.replace('/api/v1', ''));
    var schema = require(schemaLoc);
    res.json(schema);
  });
});
app.all('/api*', function(req, res) {
  var endLoc = path.join(__dirname, 'server', 'api', req.url.replace('/api', ''));
  var endpoint = require(endLoc);
  endpoint(req, res);
});
http.createServer(app).listen(app.get('port'), function() {
  console.log('Passport API JSON-Schema Spec Server listening on port ' + app.get('port'));
});