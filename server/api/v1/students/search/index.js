/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , schoolCard = require('../../../../models/schoolCard')
  , queryM = require('../../../../verbs/query')
  , application = require('../../../../models/application')
  , school = require('../../../../models/school');
/**
 *
 */
var searchSchools = {
  school: {}
}
searchSchools.get = function(req, res) {
  queryM(school)(req, function(err, response) {
    response.studentId = req.params.studentId;
    response.cardType = 'search/results/schools';
    response.username = req.username;
    response.token = req.token;
    res.json(response);
  });
};
/**
 *
 */
searchSchools.school.get = function(req, res) {
  var studentId = req.params.studentId
    , schoolId = req.params.schoolId;
  school.findById(schoolId)
    .populate("applications")
    .populate("cards")
    .exec(function(err, School) {
      var response = {
        studentId: studentId,
        schoolId: schoolId,
        school: School
      };
      response.username = req.username;
      response.token = req.token;
      res.json(response);
    });
};
module.exports = searchSchools;