var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , mongoose = require('mongoose')
  , io = require('socket.io');
// Mongoose
mongoose.connect('mongodb://localhost/psprt');
var user = require('../../server/models/user');
user.find({}, function(er, users) {
  for(var u = 0; u < users.length; u++) {
    users[u].feesPaid = [];
    users[u].markModified('feesPaid');
    users[u].save(function(err) {
    });
  }
});