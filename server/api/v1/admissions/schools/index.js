/**
 *
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , authenticate = require('../../../../helpers/authenticate')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , application = require('../../../../models/application')
  , school = require('../../../../models/school')
  , queryM = require('../../../../verbs/query');
/**
 *
 */
var admissionsSchools = {
  school: {
    application: {},
    applicant: {}
  }
};
/**
 *
 */
admissionsSchools.school.get = function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .populate('applications')
    .exec(function(err, School) {
      user.find({schools: schoolId, userPerms: 'students'})
        .populate("cards")
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
};
/**
 *
 */
admissionsSchools.school.application.csv = function(req, res) {
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
};
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
admissionsSchools.school.delete = function(req, res) {
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
};
/**
 *
 */
admissionsSchools.school.applicant.get = function(req, res) {
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
};
/**
 *
 */
module.exports = admissionsSchools
