/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , application = require('../../../../models/application')
  , school = require('../../../../models/school')
  , q = require('q');
/**
 *
 */
var admissionsApplications = {
  applications: {
    application: {
      addCards: {

      },
      assign: {

      },
      arrange: {

      },
      card: {

      }
    }
  }
};
/**
 *
 */
admissionsApplications.applications.get = function(req, res) {
  var admissionsId = req.params.admissionsId;
  application.find({admissionsId: admissionsId}, function(err, Applications) {
    res.json({
      admissionsId: admissionsId,
      applications: Applications
    });
  });
};
/**
 *
 */
admissionsApplications.applications.post = function(req, res) {
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
};
/**
 *
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
admissionsApplications.applications.application.get = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
};
/**
 *
 */
admissionsApplications.applications.application.put = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , appPost = req.body;
  application.findOneAndUpdate(applicationId, appPost, function(err, App) {
    res.set('Location', '/api/v1/admissions/' + admissionsId + '/applications/' + App._id);
    res.send(300);
  });
};
/**
 *
 */
admissionsApplications.applications.application.delete = function(req, res) {
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
};
/**
 *
 */
admissionsApplications.applications.application.removeCards = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
};
/**
 *
 */
admissionsApplications.applications.application.addCards.post = function(req, res) {
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
};
/**
 *
 */
admissionsApplications.applications.application.addCards.get = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getCardsAndApp(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
};
/**
 *
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
admissionsApplications.applications.application.assign.get = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  user.findById(admissionsId)
    .populate("schools")
    .exec(function(err, Admissions) {
      application.findById(applicationId, function(err, Application) {
        res.json({
          admissionsId: admissionsId,
          applicationId: applicationId,
          admissions: Admissions,
          application: Application
        });
      });
    });
};
/**
 *
 */
admissionsApplications.applications.application.assign.put = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId, function(err, School) {
    School.applications = _.union(School.applications, [applicationId]);
    School.save(function(err) {
      user.findById(admissionsId)
        .populate("schools")
        .exec(function(err, Admissions) {
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
};
/**
 *
 */
admissionsApplications.applications.application.assign.delete = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , schoolId = req.params.schoolId;
  school.findById(schoolId, function(err, School) {
    School.applications = _.without(School.applications, applicationId);
    School.save(function(err, Sc) {
      user.findById(admissionsId)
        .populate("schools")
        .exec(function(err, Admissions) {
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
};
/**
 *
 */
admissionsApplications.applications.application.arrange.get = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId;
  getApplicationCards(admissionsId, applicationId).then(function(response) {
    res.json(response);
  });
};
/**
 *
 */
admissionsApplications.applications.application.arrange.put = function(req, res) {
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
};
/**
 *
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
admissionsApplications.applications.application.card.put = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId
    , cardPost = req.body;
  card.findOneAndUpdate(cardId, cardPost, function(err, Card) {
    getCardsAndApp(admissionsId, applicationId).then(function(response) {
      res.json(response);
    });
  });
};
/**
 *
 */
admissionsApplications.applications.application.card.delete = function(req, res) {
  var admissionsId = req.params.admissionsId
    , applicationId = req.params.applicationId
    , cardId = req.params.cardId;
  card.findOneAndRemove({_id: cardId}, function(err) {
    getApplicationCards(admissionsId, applicationId).then(function(response) {
      res.json(response);
    });
  });
};
/**
 *
 */
module.exports = admissionsApplications;