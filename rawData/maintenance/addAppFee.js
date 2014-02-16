var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , mongoose = require('mongoose')
  , io = require('socket.io');
// Mongoose
mongoose.connect('mongodb://localhost/psprt');
var application = require('../../server/models/application');
application.find({}, function(er, apps) {
  for(var u = 0; u < apps.length; u++) {
    apps[u].fee = 30.00;
    apps[u].markModified('fee');
    apps[u].save(function(err, App) {
      console.log(err, App);
    });
  }
});