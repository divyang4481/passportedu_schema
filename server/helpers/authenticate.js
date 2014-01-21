/**
 *
 */
var _ = require('underscore')
  , user = require('../models/user')
  , uuid = require('node-uuid')
  , crypto = require('crypto');
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
    res.header('X-username', '');
    res.header('X-token', '');
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
var login = function(req, res, username, password, callback) {
  user.login(username, password, function(err, match, User) {
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
      var intercomHash = crypto.createHmac('sha256', 'c6cf7095d8d5a613876419716bd54e3cbeeca235').update(savedUser._id.toString()).digest('hex');
      res.header('X-Intercom-Username', User.username);
      res.header('X-Intercom-User-Id', User._id.toString());
      res.header('X-Intercom-Email', User.email);
      res.header('X-Intercom-Full-Name', User.fullName);
      res.header('X-Intercom-Created-At', User.created);
      res.header('X-Intercom-User-Hash', intercomHash);
      res.header('X-Intercom-API', 'c6cf7095d8d5a613876419716bd54e3cbeeca235');
      res.header('X-username', User.username);
      res.header('X-token', User.token);
      callback(null, {
        user: {
          userId: User._id.toString(),
          userType: User.userPerms[0],
          token: token,
          fullName: User.fullName,
          username: User.username,
          email: User.email,
          schools: User.schools,
          cards: User.cards,
          applications: User.applications
        }
      });
    });
  });
};
/**
 * Ongoing authorization of resources
 */
var auth = function(req, res, authToken, callback) {
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
    var intercomHash = crypto.createHmac('sha256', 'c6cf7095d8d5a613876419716bd54e3cbeeca235').update(User._id.toString()).digest('hex');
    res.header('X-Intercom-Username', User.username);
    res.header('X-Intercom-User-Id', User._id.toString());
    res.header('X-Intercom-Email', User.email);
    res.header('X-Intercom-Full-Name', User.fullName);
    res.header('X-Intercom-Created-At', User.created);
    res.header('X-Intercom-User-Hash', intercomHash);
    res.header('X-Intercom-API', 'c6cf7095d8d5a613876419716bd54e3cbeeca235');
    callback(null, {
      user: {
        userId: User._id,
        userType: User.userPerms[0],
        token: User.token,
        fullName: User.fullName,
        username: User.username,
        email: User.email,
        schools: User.schools,
        cards: User.cards,
        applications: User.applications
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