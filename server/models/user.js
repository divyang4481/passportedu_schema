var mongoose = require('mongoose')
  , _ = require('underscore')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10;
/**
 *
 */
var userPerms = 'school, admin, student'.split(', ');
/**
 *
 */
var UserSchema = new mongoose.Schema({
  username: {type: String, required: true, index: { unique: true }},
  password: {type: String, required: true},
  fullName: String,
  email: String,
  token: String,
  userPerms: [
    { type: String, enum: userPerms }
  ],
  applications: [
    {type: String, ref: "Application"}
  ],
  schools: [
    {type: String, ref: "School"}
  ]
});
UserSchema.pre('save', function(next) {
  var user = this;
  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) {
      return next(err);
    }
    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) {
        return next(err);
      }
      // override the clear-text password with the hashed one
      user.password = hash;
      next();
    });
  });
});
/**
 *
 * @param candidatePassword
 * @param cb
 */
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) {
      return cb(err, false);
    }
    cb(null, isMatch);
  });
};
/**
 * Login method
 */
UserSchema.static('login', function(credentials, callback) {
  return this.findOne({ username: credentials.username }, function(err, User) {
    if (_.isNull(User)) {
      callback({error: 'No User'});
      return;
    }
    User.comparePassword(credentials.password, function(err, isMatch) {
      callback(err, isMatch, isMatch ? User : {});
    });
  });
});
/**
 * Auth method for authorizing users to resources
 */
UserSchema.static('auth', function(username, token, callback) {
  var self = this;
  self.findOne({username: username, token: token}, function(err, result) {
    if (result) {
      callback(null, result);
      return;
    }
    self.login({username: username, password: token}, function(err, match, user) {
      callback(err, user);
    });
  });
});
/**
 * Auth method for authorizing users to resources
 */
UserSchema.static('deAuth', function(username, token, callback) {
  var self = this;
  self.findOne({username: username, token: token}, function(err, User) {
    if (User) {
      User.token = '';
      User.save(function(err) {
        callback(null, User);
      });
    }
  });
});
module.exports = mongoose.model("User", UserSchema);