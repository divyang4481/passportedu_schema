/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , user = require('../../../models/user')
  , card = require('../../../models/card')
  , application = require('../../../models/application')
  , school = require('../../../models/school')
  , queryM = require('../../../verbs/query')
  , q = require('q');
/**
 *
 */
api.use(function(req, res, next) {
  // All deeper URL's require authentication
  var authToken = req.get('Token')
    , authHeader = req.get('Authorization');
  if (authHeader) {
    authenticate.login(req, authHeader, function(err, authorization) {
      if (err && req.originalUrl === '/api/v1/admissions') {
        next();
        return;
      }
      if ((err) || (authorization.user.userType !== 'admissions')) {
        res.set('WWW-Authenticate', 'Basic realm="/api/v1/admissions"');
        res.send(401);
        return;
      }
      req.admissionsId = authorization.user.userId.toString();
      req.username = authorization.user.username;
      req.token = authorization.user.token; // Token needs to be sent back and forth always
      next();
      return;
    })
  } else if (authToken) {
    authenticate.auth(req, authToken, function(err, authorization) {
      // Allowing unauthenticated users to remain in public students area...landing page
      if (err && req.originalUrl === '/api/v1/admissions') {
        next();
        return;
      }
      if ((err) || (authorization.user.userType !== 'admissions')) {
        res.set('WWW-Authenticate', 'Basic realm="/api/v1/admissions"');
        res.send(401);
        return;
      }
      req.admissionsId = authorization.user.userId.toString();
      req.username = authorization.user.username;
      req.token = authorization.user.token; // Token needs to be sent back and forth always
      next();
      return;
    });
  } else {
    if (req.originalUrl === '/api/v1/admissions') {
      next();
      return;
    }
    res.set('WWW-Authenticate', 'Basic realm="/api/v1/admissions"');
    res.send(401);
    return;
  }
  return;
});
/**
 * Admissions Area
 */
api.get('/', function(req, res) {
  if (_.isUndefined(req.admissionsId)) {
    res.json({});
  } else {
    res.set('Location', '/api/v1/admissions/' + req.admissionsId);
    res.send(300);
  }
});
/**
 * Admissions Area
 */
api.get('/login', function(req, res) {
  if (_.isUndefined(req.admissionsId)) {
    res.set('Location', '/api/v1/admissions');
    res.send(300);
  } else {
    res.set('Location', '/api/v1/admissions/' + req.admissionsId);
    res.send(300);
  }
});
/**
 * Admissions Area
 */
api.get('/logout', function(req, res) {
  authenticate.logout(req, function(err, auth) {
    if (auth.user.userType !== 'admissions') {
      res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
      res.send(401);
      return;
    }
    if (auth.user.userType !== 'students') {
      res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
      res.send(401);
      return;
    }
  });
});
/**
 *
 */
api.get('/:admissionsId', function(req, res) {
  var admissionsId = req.params.admissionsId;
  var response = {
    admissionsId: admissionsId
  };
  user.findById(admissionsId, function(err, Admissions) {
    response.student = Admissions;
    school.find({_id: { $in: Admissions.schools}}, function(err, Schools) {
      response.schools = Schools;
      res.json(response);
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/schools/:schoolId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .populate('applications')
    .exec(function(err, School) {
      user.find({schools: schoolId, userPerms: 'students'})
        .populate("Card")
        .exec(function(err, Applicants) {
          var response = {
            admissionsId: admissionsId,
            schoolId: schoolId,
            school: School,
            applicants: Applicants
          }
          res.json(response);
        })
    });
});
/**
 *
 */
api.delete('/:admissionsId/schools/:schoolId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  user.findById(admissionsId, function(err, Admissions) {
    Admissions.schools = _.reject(Admissions.schools, function(Id) {
      return Id === schoolId;
    });
    Admissions.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId);
      res.send(300);
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/schools/:schoolId/applicants/:applicantId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId
    , applicantId = req.params.applicantId;
  user.findById(applicantId)
    .populate('applications')
    .populate('schools')
    .exec(function(err, Applicant) {
      card.find({'owners.students': applicantId}).exec(function(err, Cards) {
        var response = {
          admissionsId: admissionsId,
          schoolId: schoolId,
          applicant: Applicant,
          cards: Cards
        }
        res.json(response);
      });
    });
});
/**
 *
 */
api.get('/:admissionsId/search/schools', function(req, res) {
  queryM(school)(req, function(err, response) {
    response.admissionsId = req.params.admissionsId;
    res.json(response);
  });
});
/**
 *
 */
api.get('/:admissionsId/search/schools/:schoolId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).populate('applications').exec(function(err, School) {
    var response = {
      admissionsId: admissionsId,
      schoolId: schoolId,
      school: School
    }
    res.json(response);
  });
});
/**
 *
 */
api.get('/:admissionsId/applications', function(req, res) {
  var admissionsId = req.params.admissionsId;
  application.find({admissionsId: admissionsId}, function(err, Applications) {
    res.json({
      admissionsId: admissionsId,
      applications: Applications
    });
  });
});
/**
 *
 */
api.post('/:admissionsId/applications', function(req, res) {
  var admissionsId = req.params.admissionsId;
  var app = new application({
    admissionsId: admissionsId,
    type: req.body.type,
    mediaType: req.body.mediaType,
    data: req.body.data
  });
  app.save(function(err) {
    var applicationId = app._id.toString();
    res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId);
    res.send(300);
  });
});
/**
 *
 * @param admissionsId
 * @param applicationId
 * @returns {adapter.pending.promise|*|promise|Q.promise}
 */
var getApplicationCards = function(admissionsId, applicationId) {
  var deferred = q.defer();
  application.findById(applicationId).exec(function(err, App) {
    card.find({"owners.applications": applicationId}, function(err, Cards) {
      deferred.resolve({
        admissionsId: admissionsId,
        applicationId: applicationId,
        application: _.omit(App, ['_id']),
        cards: Cards
      });
    });
  });
  return deferred.promise;
};
/**
 *
 */
api.get('/:admissionsId/applications/:applicationId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
});
/**
 *
 */
api.put('/:admissionsId/applications/:applicationId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , appPost = req.body;
  application.findOneAndUpdate(applicationId, appPost, function(err, App) {
    res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + App._id);
    res.send(300);
  });
});
/**
 *
 */
api.delete('/:admissionsId/applications/:applicationId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  application.remove({_id: applicationId}, function(err) {
    if (err) {
      res.json({
        "errors": [
          {message: "There was an error when trying to delete your application."}
        ]
      });
      return;
    }
    res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications');
    res.send(300);
  });
});
/**
 *
 */
api.post('/:admissionsId/applications/:applicationId/addCards/*', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardBody = req.body;
  cardBody.owners = {};
  cardBody.owners.applications = applicationId;
  cardBody.owners.admissions = admissionsId;
  cardBody.type = req.params[0];
  cardBody.order = 100;
  var Card = new card(cardBody);
  Card.save(function(err) {
    if (err) {
      res.send(415);
      return;
    }
    getCardsAndApp(admissionsId, applicationId).then(function(response) {
      res.json(response);
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/applications/:applicationId/addCards', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getCardsAndApp(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
});
/**
 *
 * @param admissionsId
 * @param applicationId
 * @returns {adapter.pending.promise|*|promise|Q.promise}
 */
var getCardsAndApp = function(admissionsId, applicationId) {
  var deferred = q.defer();
  application.findById(applicationId).exec(function(err, App) {
    var response = {
      admissionsId: admissionsId,
      applicationId: applicationId,
      application: _.omit(App, ['_id']),
      cards: [
        {type: "application/attendance/term"},
        {type: "application/documents/transcript"},
        {type: "application/documents/passport"},
        {type: "application/documents/government"},
        {type: "application/contact/basic"},
        {type: "application/contact/guardian"},
        {type: "application/contact/address/home"},
        {type: "application/contact/address/mailing"},
        {type: "application/nationality"},
        {type: "application/demographic"},
        {type: "application/language"},
        {type: "application/academic/exams/sat"},
        {type: "application/academic/exams/gre"},
        {type: "application/academic/exams/gmat"},
        {type: "application/academic/schools/previous"}
      ]
    };
    deferred.resolve(response);
  });
  return deferred.promise;
};
/**
 *
 */
api.get('/:admissionsId/applications/:applicationId/assign', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  user.findById(admissionsId).populate("schools").exec(function(err, Admissions) {
    application.findById(applicationId, function(err, Application) {
      res.json({
        admissionsId: admissionsId,
        applicationId: applicationId,
        admissions: Admissions,
        application: Application
      });
    });
  });
});
/**
 *
 */
api.put('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId, function(err, School) {
    School.applications = _.union(School.applications, [applicationId]);
    School.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId + '/assign');
      res.send(300);
    });
  });
});
/**
 *
 */
api.delete('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId, function(err, School) {
    School.applications = _.without(School.applications, applicationId);
    School.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId + '/assign');
      res.send(300);
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/applications/:applicationId/cards/:cardId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  application.findById(applicationId).exec(function(err, App) {
    card.findById(cardId).exec(function(err, Card) {
      res.json({
        admissionsId: admissionsId,
        applicationId: applicationId,
        application: _.omit(App, ['_id']),
        cardId: cardId,
        card: Card
      });
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/applications/:applicationId/arrange', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
});
/**
 *
 */
api.put('/:admissionsId/applications/:applicationId/cards/:cardId/arrange', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId
    , cardPost = req.body;
  card.find({"owners.applications": applicationId}).sort('order').exec(function(err, Cards) {
    var insertBeforeId = 0
      , newCardOrder = 0;
    for(i in Cards) {
      var Card = Cards[i];
      if (Card.order === cardPost.order) {
        insertBeforeId = Card._id.toString();
        newCardOrder = i;
      }
      Card.order = i;
    }
    var increment = 0;
    var promises = [];
    var thenFn = function(value) {
      return value;
    };
    var order = 0;
    _.each(Cards, function(Card) {
      if (Card._id.toString() == insertBeforeId) {
        increment = 1;
      }
      if (Card._id.toString() == cardId) {
        Card.order = newCardOrder;
      }
      else {
        Card.order = +order + +increment;
      }
      order++;
      var deferred = q.defer();
      Card.save(function(err, savedCard) {
        deferred.resolve(savedCard);
        console.log([savedCard.order, savedCard.type]);
      });
      promises.push(deferred.promise.then(thenFn));
    })
    q.all(promises).then(function(results) {
      res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId + '/arrange');
      res.send(300);
    });
  });
});
/**
 *
 */
api.put('/:admissionsId/applications/:applicationId/cards/:cardId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId
    , cardPost = req.body;
  card.findOneAndUpdate(cardId, cardPost, function(err, Card) {
    res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId + '/cards/' + cardId);
    res.send(300);
  });
});
/**
 *
 */
api.delete('/:admissionsId/applications/:applicationId/cards/:cardId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  card.findOneAndRemove({_id: cardId}, function(err) {
    res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId);
    res.send(300);
  });
});
/**
 *
 */
api.get('/:admissionsId/search/schools', function(req, res) {
  queryM(school)(req, function(err, response) {
    response.admissionsId = req.params.admissionsId;
    response.cardType = 'search/results/schools';
    res.json(response);
  });
});
/**
 *
 */
api.get('/:admissionsId/search/schools/:schoolId', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  school.findById(schoolId).exec().then(function(School) {
    var response = {
      admissionsId: admissionsId,
      schoolId: schoolId,
      school: School
    }
    res.json(response);
  });
});
/**
 *
 */
api.put('/:admissionsId/search/schools/:schoolId/claim', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  user.findById(admissionsId).exec(function(err, Admissions) {
    Admissions.schools = _.union(Admissions.schools, [schoolId]);
    Admissions.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId);
      res.send(300);
    });
  });
});
/**
 *
 */
api.delete('/:admissionsId/search/schools/:schoolId/claim', function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  user.findById(admissionsId).exec(function(err, Admissions) {
    Admissions.schools = _.without(Admissions.schools, schoolId);
    Admissions.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId);
      res.send(300);
    });
  });
});
/**
 *
 */
module.exports = api;