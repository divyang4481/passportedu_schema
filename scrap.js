

app.get('/api/v1/authenticate', require('./server/api/v1/authenticate'));
app.post('/api/v1/authenticate', require('./server/api/v1/authenticate'));
app.use('/api/v1/students', require('./server/api/v1/students'));
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
        application: application,
        cards: cards
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
        res.set('Location', '/api/v1/students/' + studentId + '/applications/' + applicationId);
        res.send(302);
      });
    });
  });
});
var getM = require('./server/verbs/get')
app.use('/api/v1/students/:studentId/applications/:applicationId/cards', function(req, res, next) {
  var studentId = req.params.studentId;
  req.body.ownerId = studentId;
  next();
}, getM(card));