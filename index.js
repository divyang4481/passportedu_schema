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

function loadVariPath(startPath, remaining, callback) {
  fs.readdir(startPath, function(err, files) {
    for (i in files) {
     if(files[i].match(/{{.*}}/)) {
       var match = files[i].match(/{{(.*)}}/)[1];
       loadPath(path.join(startPath, files[i]), remaining, callback);
       return;
     }
    }
    callback(require(startPath));
  });
}
function loadPath(startPath, remaining, callback) {
  if (remaining.length == 0) {
    callback(require(startPath));
    return;
  }
  var test_path = path.join(startPath, remaining.shift());
  fs.exists(test_path, function(exists) {
    if (exists) {
      loadPath(test_path, remaining, callback);
    } else {
      loadVariPath(startPath, remaining, callback);
    }
  });
}
app.options('/api*', function(req, res) {
  var optionPath = req.originalUrl.split('/');
  loadPath(path.join(__dirname, 'options'), optionPath, function(options) {
    res.json(options);
  });
});
app.get('/api/v1', require('./server/api/v1'));
app.get('/api/v1/public/authenticate', require('./server/api/v1/public/authenticate'));
app.post('/api/v1/public/authenticate', require('./server/api/v1/public/authenticate'));
app.use('/api/v1/students', rest(user));
app.get('/api/v1/students/:studentId/applications', function(req, res) {
  var studentId = req.params.studentId;
  application.rest({studentId: studentId}, function(err, applications) {
    res.json({
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
