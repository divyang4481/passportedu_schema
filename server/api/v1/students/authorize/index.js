/**
 *
 */
var authenticate = require('../../../../helpers/authenticate')
  , user = require('../../../../models/user')
/**
 *
 */
var register = {};
var login = {};
register.get = function(req, res) {
  res.json({});
};
/**
 *
 */
register.post = function(req, res) {
  var students = req.body;
  students.userPerms = ['students'];
  students.created = Math.round(new Date().getTime() / 1000);
  user.create(students, function(err, Student) {
    if (err) {
      res.json({
        error: err
      });
    } else {
      authenticate.login(req, res, req.body.username, req.body.password,
        function(err, authorization) {
          if (err || authorization.user.userType !== 'students') {
            res.set('Location', '/api/v1/students/register');
            res.send(300);
            return;
          }
          res.set('Location', '/api/v1/students/' + authorization.user.userId);
          res.send(300);
        });
    }
  });
};
/**
 *
 */

login.get = function(req, res) {
  res.json({});
};
/**
 *
 */
login.post = function(req, res) {
  authenticate.login(req, res, req.body.username, req.body.password,
    function(err, authorization) {
      if (err || authorization.user.userType !== 'students') {
        res.set('Location', '/api/v1/students/register');
        res.send(300);
        return;
      }
      res.set('Location', '/api/v1/students/' + authorization.user.userId);
      res.send(300);
    });
};
/**
 *
 */
var logout = {};
logout.get = function(req, res) {
  authenticate.logout(req, function(err, auth) {
    res.set('Location', '/api/v1/students/login');
    res.send(300);
  });
};
//
module.exports = {
  register: register,
  login: login,
  logout: logout
};