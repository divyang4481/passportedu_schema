/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , school = require('../../../../models/school')
  , application = require('../../../../models/application')
  , q = require('q');
/**
 *
 */
var root = {
  student: {}
};
/**
 *
 */
root.get = function(req, res) {
  res.json({});
};
/**
 *
 */
root.student.get = function(req, res) {
  var studentId = req.params.studentId;
  var response = {
    studentId: studentId
  };
  user.findById(studentId)
    .exec(function(err, Student) {
      application.find({_id: {$in: Student.applications}})
        .populate('schools')
        .exec(function(err, Applications) {
          response.student = Student;
          response.applications = Applications;
          response.username = req.username;
          response.token = req.token;
          res.json(response);
        });
    });
};
module.exports = root;
