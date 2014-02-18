/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , fs = require('fs')
  , mongoose = require('mongoose')
  , io = require('socket.io');
// Mongoose
mongoose.connect('mongodb://localhost/psprt');
/**
 * Express
 */
var app = express();
/**
 * Create the server
 */
var server = http.createServer(app);
/**
 * Add a Socket IO Listener
 */
io = io.listen(server);
/**
 * For other modules to hook in
 * @type {*|exports}
 */
module.exports = {
  io: io
};
//app.set('port', 80);
app.use(express.logger());
app.use(app.router);
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
var schoolCard = require('./server/models/schoolCard');
var user = require('./server/models/user');
var application = require('./server/models/application');
var school = require('./server/models/school');
var rest = require('./server/rest');
/**
 *
 */
app.use('/api/v1/resources/users', rest(user));
app.use('/api/v1/resources/cards', rest(card));
app.use('/api/v1/resources/schoolCards', rest(schoolCard));
app.use('/api/v1/resources/schools', rest(school));
app.use('/api/v1/resources/applications', rest(application));
/**
 * Stripe Server
 */
var stripeServer = require('./servers/stripe-server');
app.use('/api/v1/stripe', stripeServer);
/**
 * Hypermedia API
 */
app.use('/api/v1', require('./server/api/v1'));
/**
 *
 */
var templates = require('./templates')
app.get('/templates*', templates);
/**
 * Start Server
 */
server.listen(80, function() {
  console.log('Listening on port ' + 80);
});
var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};
https.createServer(options, app).listen(443, function() {
  console.log('Listening on port ' + 443);
});
