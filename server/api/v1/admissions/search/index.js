var _ = require('underscore')
/**
 *
 */
var user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , application = require('../../../../models/application')
  , school = require('../../../../models/school')
  , queryM = require('../../../../verbs/query')
/**
 *
 */
var admissionsSearch = {
  schools: {
    school: {}
  }
}
/**
 *
 */
admissionsSearch.schools.get = function(req, res) {
  queryM(school)(req, function(err, response) {
    response.admissionsId = req.params.admissionsId;
    res.json(response);
  });
};
/**
 *
 */
admissionsSearch.schools.school.get = function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .populate('applications')
    .exec(function(err, School) {
      var response = {
        admissionsId: admissionsId,
        schoolId: schoolId,
        school: School
      }
      res.json(response);
    });
};
/**
 *
 */
admissionsSearch.schools.school.claim = function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  user.findById(admissionsId).exec(function(err, Admissions) {
    Admissions.schools = _.union(Admissions.schools, [schoolId]);
    Admissions.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId);
      res.send(300);
    });
  });
};
/**
 *
 */
admissionsSearch.schools.school.unclaim = function(req, res) {
  var admissionsId = req.params.admissionsId
    , schoolId = req.params.schoolId;
  user.findById(admissionsId).exec(function(err, Admissions) {
    Admissions.schools = _.without(Admissions.schools, schoolId);
    Admissions.save(function(err) {
      res.set('Location', '/api/v1/admissions/' + admissionsId);
      res.send(300);
    });
  });
};
/**
 *
 */
module.exports = admissionsSearch;