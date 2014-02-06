/**
 *
 */
var user = require('../../../../models/user')
  , card = require('../../../../models/card')
  , application = require('../../../../models/application')
  , school = require('../../../../models/school')
  , authenticate = require('../../../../helpers/authenticate')
  , admissionAuth = {
    register: {},
    login: {},
    logout: {}
  };
/**
 *
 */
admissionAuth.register.get = function(req, res) {
  res.json({});
};
/**
 *
 */
admissionAuth.register.post = function(req, res) {
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
};
/**
 *
 */
admissionAuth.login.get = function(req, res) {
  res.json({});
};
/**
 *
 */
admissionAuth.login.post = function(req, res) {
  authenticate.login(req, res, req.body.username, req.body.password, function(err, authorization) {
    if (err || authorization.user.userType != 'admissions') {
      res.set('Location', '/api/v1/admissions/register');
      res.send(300);
      return;
    }
    res.set('Location', '/api/v1/admissions/' + authorization.user.userId);
    res.send(300);
  });
};
/**
 *
 */
admissionAuth.logout.get = function(req, res) {
  authenticate.logout(req, function(err, auth) {
    res.set('Location', '/api/v1/admissions/login');
    res.send(300);
  });
};
/**
 *
 */
module.exports = admissionAuth;