/**
 *
 */
var _ = require('underscore')
  , user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , school = require('../../../../models/school')
  , q = require('q');
/**
 *
 */
var root = {};
root.get = function(req, res) {
  res.json({});
};
root.student = {};
root.student.get = function(req, res) {
  var studentId = req.params.studentId;
  var response = {
    studentId: studentId
  };
  user.findById(studentId)
    .populate('schools')
    .populate('applications')
    .exec(function(err, Student) {
      response.student = Student;
      response.username = req.username;
      response.token = req.token;
      res.json(response);
    });
};
module.exports = root;
