var config = require('config').stripe
  , _ = require('underscore')
  , q = require('q')
  , stripe = require('stripe')(config.secret_key)
  , express = require('express')
  , api = express()
  , https = require('https')
  , querystring = require('querystring')
  , authenticate = require('../server/helpers/authenticate')
  , user = require('../server/models/user')
  , school = require('../server/models/school')
  , application = require('../server/models/application')
/**
 * Authentication Middleware
 * Getting user from token
 */
var auth = function(req, res, next) {
  // All deeper URL's require authentication
  var authToken = req.get('Token');
  if (authToken) {
    authenticate.auth(req, res, authToken, function(err, authorization) {
      if (err) {
        res.set('Location', '/api/v1');
        res.send(300);
        return;
      }
      req.User = authorization.userObj;
      req.authorization = authorization.user;
      next();
    });
  } else {
    res.set('Location', '/api/v1');
    res.send(300);
  }
};
/**
 *
 * @param code
 * @returns {promise}
 */
var getStripeToken = function(code) {
  var deferred = q.defer();
  var data = querystring.stringify({
    client_secret: config.secret_key,
    code: code,
    grant_type: 'authorization_code'
  });
  var options = {
    hostname: 'connect.stripe.com',
    port: 443,
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Length': Buffer.byteLength(data, 'utf8')
    }
  };
  var req = https.request(options, function(res) {
    res.on('data', function(d) {
      deferred.resolve(d);
    });
  });
  req.on('error', function(e) {
    console.error(e);
  });
  req.write(data);
  req.end();
  return deferred.promise;
}
/**
 * User has connected a Stripe Account as a Merchant
 */
api.get('/connected', auth, function(req, res) {
  var code = req.query.code
    , state = req.query.state;
  getStripeToken(code).then(function(response) {
    var stripe = JSON.parse(response.toString());
    var route = state.split('|');
    application.findById(route[1]).exec(function(err, Application) {
      Application.stripe = [stripe];
      Application.save(function(err) {
        var location = '/api/v1/' + req.authorization.userType + '/' + req.authorization.userId + '/schools/' + route[0] + '/applications/' + route[1];
        res.set('Location', location);
        res.send(300);
      });
    });
  });
});
api.get('/webhooks', auth, function(req, res) {
});
/**
 * Accounts
 */
api.post('/:userId/accounts/new', auth, function(req, res) {
});
api.put('/:userId/accounts/:accountId', auth, function(req, res) {
});
api.get('/:userId/accounts', auth, function(req, res) {
});
api.get('/:userId/accounts/:accountId', auth, function(req, res) {
});
/**
 * Credit Cards
 */
api.post('/:userId/cards/new', auth, function(req, res) {
});
api.put('/:userId/cards/:cardId', auth, function(req, res) {
});
api.delete('/:userId/cards/:cardId', auth, function(req, res) {
});
api.get('/:userId/cards/', auth, function(req, res) {
});
api.get('/:userId/cards/:cardId', auth, function(req, res) {
});
/**
 *
 */
module.exports = api;