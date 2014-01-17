var express = require('express')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , util = require('util')
  , user = require('../server/models/user')
app = express();
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.login({ username: username, password: password }, function(err, isMatch, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true })
);
module.exports = app;