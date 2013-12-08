var _ = require('underscore')
  , UserModel = require('../models/user')
  , uuid = require('node-uuid');
// Secret code word :)
var secret = 'Passport is your ticket to better colleges and students.';
var login = function(req, callback) {
  if (_.isUndefined(req.body.username)) {
    callback({
      error: {
        message: 'Please provide a username.'
      }
    });
    return;
  }
  UserModel.login(req.body, function(err, match, User) {
    if (!match) {
      callback({
        error: {
          message: 'Username and password do not match.'
        }
      });
      return;
    }
    var token = uuid.v4();
    // Add token to user
    User.token = token;
    User.save(function(err, savedUser) {
      callback(null, {
        token: token,
        fullName: savedUser.fullName,
        username: savedUser.username
      });
    });
  });
};
var auth = function(req, callback) {
  var authToken = req.get('Token');
  if (_.isUndefined(authToken)) {
    callback(null, {
      permission: ['public']
    });
    return;
  }
  authToken = new Buffer(authToken, 'base64').toString();
  var credentials = authToken.split(':');
  UserModel.auth(credentials[0], credentials[1], function(err, User) {
    console.log(err, User);
    if (err || !User) {
      callback({error: 'User not found'});
      return;
    }
    callback(null, {
      permission: User.userPerms,
      username: credentials[0]
    });
  });
};
module.exports = {
  login: login,
  auth: auth
}