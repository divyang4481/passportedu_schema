/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , rest = require('./server/rest')
  , fs = require('fs')
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
var user = require('./server/models/user');
var application = require('./server/models/application');
/**
 * API
 */
app.use(express.json());
app.use(express.urlencoded());
//app.options('/api/v1/students/:studentId', function(req, res) {
//  var response = require(path.join(__dirname, 'options/v1/students'));
//  res.send(response);
//});
//app.options('/api/v1/students/:studentId/applications', function(req, res) {
//  var response = require(path.join(__dirname, 'options/v1/students/applications'));
//  res.send(response);
//});
//app.options('/api/v1/students/:studentId/applications/:applicationId', function(req, res) {
//  var response = require(path.join(__dirname, 'options/v1/students/applications'));
//  res.send(response);
//});
app.options('/api*', function(req, res) {
  var schemaLoc = path.join(__dirname, 'options', 'v1', req.url.replace('/api/v1', ''));
  var schema = require(schemaLoc);
  res.json(schema);
});

function findPath(startPath, remaining) {
  if(remaining.length == 0)
  {
    return startPath;
  }
  fs.exists(path.join(startPath, remaining.shift()), function(exists) {
    if (exists) {
      return findPath(path.join(startPath, remaining.shift()), remaining);
    } else {

    }
  });
}

app.options('/api*', function(req, res) {
  var optionPath = req.originalUrl.split('/');
  var realOptionPath = findPath(path.join(__dirname, 'options'), optionPath);
});

app.get('/api/v1', require('./server/api/v1'));
app.get('/api/v1/public/authenticate', require('./server/api/v1/public/authenticate'));
app.post('/api/v1/public/authenticate', require('./server/api/v1/public/authenticate'));
app.use('/api/v1/students', rest(user));
app.get('/api/v1/students/:studentId/applications', function(req, res) {
  var studentId = req.params.studentId;
  application.find({studentId: studentId}, function(err, applications) {
    res.json({
      studentId: studentId,
      applications: applications
    });
  });
});

app.get('/api/v1/students/:studentId', function(req, res) {
  var studentId = req.params.studentId;
  res.json({
    studentId: studentId
  });
});
app.post('/api/v1/students/:studentId/applications', function(req, res) {
  var studentId = req.params.studentId;
  var app = new application({studentId: studentId});
  app.save(function(err) {
    res.json({
      studentId: studentId,
      application: app
    });
  });
});
app.get('/api/v1/students/:studentId/applications/:applicationId', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId;
  application.findOne({_id: applicationId}, function(err, application) {
    card.find({
      '_id': { $in: application.cardIds }
    }, function(err, cards) {
      res.json({
        studentId: studentId,
        applicationId: applicationId,
        cards: application.cards
      });
    });
  });
});
app.post('/api/v1/students/:studentId/applications/:applicationId/cards', function(req, res) {
  var studentId = req.params.studentId
    , applicationId = req.params.applicationId
    , postBody = req.body;
  postBody.ownerId = studentId;
  var Card = new card(postBody);
  Card.save(function(err, savedCard) {
    application.findOne({_id: applicationId}, function(err, Application) {
      Application.cardIds.push(savedCard._id);
      Application.save(function(err, savedApp) {
        res.json({
          applicationId: applicationId,
          studentId: studentId,
          cards: [
            Card
          ]
        });
      });
    });
  });
});
http.createServer(app).listen(app.get('port'), function() {
  console.log('Passport API JSON-Schema Spec Server listening on port ' + app.get('port'));
});