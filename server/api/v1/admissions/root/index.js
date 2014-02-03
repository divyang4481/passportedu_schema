/**
 *
 */
var user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , application = require('../../../../models/application')
  , school = require('../../../../models/school')
/**
 *
 */
var root = {
  admissions: {}
};
root.get = function(req, res) {
  res.json({});
};
/**
 *
 */
root.admissions.get = function(req, res) {
  var admissionsId = req.params.admissionsId;
  var response = {
    admissionsId: admissionsId
  };
  user.findById(admissionsId)
    .populate('schools')
    .populate('applications')
    .exec(function(err, Admissions) {
    response.admissions = Admissions;
    response.schools = Admissions.schools;
    res.json(response);
  });
};

module.exports = root;