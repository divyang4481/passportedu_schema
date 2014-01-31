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
 * Register and Login Package
 */
api.get('/', function(req, res) {
  res.json({});
});
/**
 *
 */
api.get('/register', function(req, res) {
  res.json({});
});
/**
 *
 */
api.post('/register', function(req, res) {
  var admissions = req.body;
  admissions.userPerms = ['admissions'];
  admissions.created = Math.round(new Date().getTime() / 1000);
  user.create(admissions, function(err, Admissions) {
    if (err) {
      res.json({
        error: err
      });
    } else {
      authenticate.login(req, res, req.body.username, req.body.password, function(err, authorization) {
        if (err || authorization.user.userType !== 'admissions') {
          res.set('Location', '/api/v1/admissions/register');
          res.send(300);
          return;
        }
        res.set('Location', '/api/v1/admissions/' + authorization.user.userId);
        res.send(300);
      });
    }
  });
});
/**
 *
 */
api.get('/login', function(req, res) {
  res.json({});
});
/**
 *
 */
api.post('/login', function(req, res) {
  authenticate.login(req, res, req.body.username, req.body.password, function(err, authorization) {
    if (err || authorization.user.userType != 'admissions') {
      res.set('Location', '/api/v1/admissions/register');
      res.send(300);
      return;
    }
    res.set('Location', '/api/v1/admissions/' + authorization.user.userId);
    res.send(300);
  });
});
/**
 *
 */
var auth = function(req, res, next) {
  // All deeper URL's require authentication
  var authToken = req.get('Token');
  if (authToken) {
    authenticate.auth(req, res, authToken, function(err, authorization) {
      var admissionsId = req.params.admissionsId;
      if ((err)
        || (authorization.user.userType !== 'admissions')
        || (!_.isUndefined(admissionsId) && admissionsId !== authorization.user.userId.toString())) {
        res.set('Location', '/api/v1/admissions/login');
        res.send(300);
        return;
      }
      user.count({schools: {$in: authorization.user.schools}}, function(err, countApplicants) {
        req.admissionsId = authorization.user.userId.toString();
        req.username = authorization.user.username;
        req.token = authorization.user.token; // Token needs to be sent back and forth always
        res.header('X-Intercom-Custom', JSON.stringify({
          "userType": authorization.user.userType,
          "schools": authorization.user.schools.length,
          "applications": authorization.user.applications.length,
          "applicants": countApplicants
        }));
        next();
      });
    });
  } else {
    res.set('Location', '/api/v1/admissions/login');
    res.send(300);
  }
};
/**
 *
 */
api.get('/logout', function(req, res) {
  authenticate.logout(req, function(err, auth) {
    res.set('Location', '/api/v1/admissions/login');
    res.send(300);
  });
});
/**
 *
 */
api.get('/:admissionsId', auth, function(req, res) {
  var admissionsId = req.params.admissionsId;
  var response = {
    admissionsId: admissionsId
  };
  user.findById(admissionsId, function(err, Admissions) {
    response.admissions = Admissions;
    school.find({_id: { $in: Admissions.schools}}, function(err, Schools) {
      response.schools = Schools;
      res.json(response);
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/schools/:schoolId', auth, function(req, res) {
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
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId/csv', auth, function(req, res) {
  var schoolId = req.params.schoolId
    , admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(application) {
    user.find({schools: schoolId, userPerms: 'students'})
      .populate({'path': 'cards', options: {sort: {'order': 1}}})
      .exec(function(err, Applicants) {
        var applications = flattenApplicationFields(Applicants, application.cards);
        res.set('Content-Type', 'text/csv');
        res.send(applications);
      });
  });
});
/**
 * Generate a header row
 * Generate a single row per applicant, csv formatted
 */
var mustache = require('mustache')
  , fs = require('fs')
  , path = require('path');
var flattenApplicationFields = function(Applicants, Cards) {
  var cardCache = {};
  for(var c = 0; c < Cards.length; c++) {
    var appCard = Cards[c].toObject()
      , csvTemplateFile = path.normalize(__dirname + '/../../../../templates/api/v1/card/' + appCard.type + '/index.csv')
      , csvTemplate = fs.readFileSync(csvTemplateFile).toString()
      , csvHeaderTemplateFile = path.normalize(__dirname + '/../../../../templates/api/v1/card/' + appCard.type + '/header.csv')
      , csvHeaderTemplate = fs.readFileSync(csvHeaderTemplateFile).toString()
    cardCache[appCard.type] = {
      card: appCard,
      template: csvTemplate,
      header: csvHeaderTemplate
    };
  }
  var rows = [];
  // Put each applicant on a row, and then put all the applicants cards in their row
  for(var c = 0; c < Cards.length; c++) {
    var appCard = Cards[c].toObject()
      , csvTemplate = cardCache[appCard.type].template;
    if (_.isUndefined(rows[0])) {
      rows[0] = [];
    }
    rows[0].push(cardCache[appCard.type].header);
    for(var a = 0; a < Applicants.length; a++) {
      var Applicant = Applicants[a];
      var Card = Applicant.cards[c];
      Card = _.isUndefined(Card) ? {} : Card.toObject();
      var cardCSV = mustache.render(csvTemplate, Card);
      if (_.isUndefined(rows[a + 1])) {
        rows[a + 1] = [];
      }
      rows[a + 1].push(cardCSV);
    }
  }
  for(var r = 0; r < rows.length; r++) {
    rows[r] = rows[r].join(",");
  }
  return rows.join("\n");
};
/**
 *
 */
api.delete('/:admissionsId/schools/:schoolId', auth, function(req, res) {
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
api.get('/:admissionsId/schools/:schoolId/applicants/:applicantId', auth, function(req, res) {
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
api.get('/:admissionsId/search/schools', auth, function(req, res) {
  queryM(school)(req, function(err, response) {
    response.admissionsId = req.params.admissionsId;
    res.json(response);
  });
});
/**
 *
 */
api.get('/:admissionsId/search/schools/:schoolId', auth, function(req, res) {
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
api.get('/:admissionsId/applications', auth, function(req, res) {
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
api.post('/:admissionsId/applications', auth, function(req, res) {
  var admissionsId = req.params.admissionsId;
  var app = {
    admissionsId: admissionsId,
    type: req.body.type,
    mediaType: req.body.mediaType,
    data: req.body.data
  }
  application.create(app, function(err, App) {
    var applicationId = App._id.toString();
    user.update({_id: admissionsId}, {$addToSet: {applications: applicationId}}, function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + applicationId);
      res.send(300);
    });
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
    card.find({"owners.applications": applicationId})
      .sort({'order': 1})
      .exec(function(err, Cards) {
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
api.get('/:admissionsId/applications/:applicationId', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
});
/**
 *
 */
api.put('/:admissionsId/applications/:applicationId', auth, function(req, res) {
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
api.delete('/:admissionsId/applications/:applicationId', auth, function(req, res) {
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
api.get('/:admissionsId/applications/:applicationId/removeCards', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
});
/**
 *
 */
api.post('/:admissionsId/applications/:applicationId/addCards/*', auth, function(req, res) {
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
api.get('/:admissionsId/applications/:applicationId/addCards', auth, function(req, res) {
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
        {type: "application/attendance/period"},
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
api.get('/:admissionsId/applications/:applicationId/assign', auth, function(req, res) {
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
api.put('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId, function(err, School) {
    School.applications = _.union(School.applications, [applicationId]);
    School.save(function(err) {
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
  });
});
/**
 *
 */
api.delete('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId, function(err, School) {
    School.applications = _.without(School.applications, applicationId);
    School.save(function(err, Sc) {
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
  });
});
/**
 *
 */
api.get('/:admissionsId/applications/:applicationId/cards/:cardId', auth, function(req, res) {
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
api.get('/:admissionsId/applications/:applicationId/arrange', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
});
/**
 *
 */
api.put('/:admissionsId/applications/:applicationId/cards/:cardId/arrange', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId
    , dragAndDrop = req.body;
  card.find({"owners.applications": applicationId}).sort('order').exec(function(err, Cards) {
    reArrangeCards(cardId, Cards, dragAndDrop).then(function(savedCards) {
      getApplicationCards(admissionsId, applicationId).then(function(response) {
        res.json(response);
      });
    });
  });
});
/**
 *
 * @param cardId
 * @param Cards
 * @param dragAndDrop
 * @returns {adapter.deferred.promise|*|promise|Q.promise}
 */
var reArrangeCards = function(cardId, Cards, dragAndDrop) {
  var mainDeferred = q.defer();
  var cardIds = _.map(Cards, function(Card) {
    return Card._id.toString();
  });
  var dropIndex = _.indexOf(cardIds, dragAndDrop.drop._id);
  var dragIndex = _.indexOf(cardIds, dragAndDrop.drag._id);
  var Drag = Cards.splice(dragIndex, 1)[0];
  Cards.splice(dropIndex, 0, Drag);
  var promises = [];
  // Array of promises callback
  var thenFn = function(value) {
    return value;
  };
  for(var i in Cards) {
    var saveIt = function(i, Cards, promises) {
      var deferred = q.defer()
        , Card = Cards[i];
      Card.order = i;
      Card.save(function(err, savedCard) {
        deferred.resolve(savedCard);
      });
      promises.push(deferred.promise);
    }
    saveIt(i, Cards, promises);
  }
  q.all(promises).then(function(results) {
    mainDeferred.resolve(results);
  });
  return mainDeferred.promise;
}
/**
 *
 */
api.put('/:admissionsId/applications/:applicationId/cards/:cardId', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId
    , cardPost = req.body;
  card.findOneAndUpdate(cardId, cardPost, function(err, Card) {
    getCardsAndApp(admissionsId, applicationId).then(function(response) {
      res.json(response);
    });
  });
});
/**
 *
 */
api.delete('/:admissionsId/applications/:applicationId/cards/:cardId', auth, function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  card.findOneAndRemove({_id: cardId}, function(err) {
    getApplicationCards(admissionsId, applicationId).then(function(response) {
      res.json(response);
    });
  });
});
/**
 *
 */
api.get('/:admissionsId/search/schools', auth, function(req, res) {
  queryM(school)(req, function(err, response) {
    response.admissionsId = req.params.admissionsId;
    response.cardType = 'search/results/schools';
    res.json(response);
  });
});
/**
 *
 */
api.get('/:admissionsId/search/schools/:schoolId', auth, function(req, res) {
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
api.put('/:admissionsId/search/schools/:schoolId/claim', auth, function(req, res) {
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
api.delete('/:admissionsId/search/schools/:schoolId/claim', auth, function(req, res) {
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