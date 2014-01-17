/**
 *
 */
var _ = require('underscore')
  , user = require('../models/user')
  , uuid = require('node-uuid');
// Secret code word :)
var secret = 'Passport is your ticket to better colleges and students.';
/**
 *
 * @param req
 * @param callback
 */
var logout = function(req, callback) {
  var authToken = req.get('Authorization');
  if (_.isUndefined(authToken)) {
    callback(null, {
      user: {
        userType: 'public'
      }
    });
    return;
  }
  authToken = new Buffer(authToken.replace(/Basic /, ''), 'base64').toString();
  var credentials = authToken.split(':');
  user.deAuth(credentials[0], credentials[1], function(err, User) {
    if (err || !User) {
      callback({error: 'User not found'});
      return;
    }
    callback(null, {
      user: {
        userId: User._id,
        userType: User.userPerms[0],
        fullName: User.fullName,
        username: User.username
      }
    });
  });
}
/**
 * var authToken = req.get('Authorization');
 */
var login = function(req, authHeader, callback) {
  if (_.isUndefined(authHeader)) {
    callback(null, {
      user: {
        userType: 'public'
      }
    });
    return;
  }
  authHeader = new Buffer(authHeader.replace(/Basic /, ''), 'base64').toString();
  var credentials = authHeader.split(':');
  user.login(credentials[0], credentials[1], function(err, match, User) {
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
        user: {
          userId: User._id,
          userType: User.userPerms[0],
          token: token,
          fullName: User.fullName,
          username: User.username
        }
      });
    });
  });
};
/**
 * Ongoing authorization of resources
 */
var auth = function(req, authToken, callback) {
  if (_.isUndefined(authToken)) {
    callback(null, {
      user: {
        userType: 'public'
      }
    });
    return;
  }
  authToken = new Buffer(authToken.replace(/Basic /, ''), 'base64').toString();
  var credentials = authToken.split(':');
  user.auth(credentials[0], credentials[1], function(err, User) {
    if (err || !User) {
      callback({error: 'User not found'});
      return;
    }
    callback(null, {
      user: {
        userId: User._id,
        userType: User.userPerms[0],
        token: User.token,
        fullName: User.fullName,
        username: User.username
      }
    });
  });
};
/**
 *
 */
module.exports = {
  login: login,
  auth: auth,
  logout: logout
};