var express = require('express')
  , api = express()
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore');
/**
 *
 * @param startPath
 * @param remaining
 * @param callback
 */
function loadVariPath(startPath, remaining, callback) {
  fs.readdir(startPath, function(err, files) {
    for(i in files) {
      if (files[i].match(/{{.*}}/)) {
        var match = files[i].match(/{{(.*)}}/)[1];
        loadPath(path.join(startPath, files[i]), remaining, callback);
        return;
      }
    }
    if (fs.lstatSync(startPath).isDirectory()) {
      startPath = startPath + '/index.html';
    }
    fs.readFile(startPath, function(err, data) {
      callback(data);
    });
  });
}
/**
 *
 * @param startPath
 * @param remaining
 * @param callback
 */
function loadPath(startPath, remaining, callback) {
  if (remaining.length == 0) {
    if (fs.lstatSync(startPath).isDirectory()) {
      startPath = startPath + '/index.html';
    }
    fs.readFile(startPath, function(err, data) {
      callback(data);
    });
    return;
  }
  var test_path = path.join(startPath, remaining.shift());
  fs.exists(test_path, function(exists) {
    if (exists) {
      loadPath(test_path, remaining, callback);
    } else {
      loadVariPath(startPath, remaining, callback);
    }
  });
}
module.exports = function(req, res) {
  var optionPath = req.originalUrl.replace('templates/','').replace(/\?.*$/, '').split('/');
  optionPath = _.filter(optionPath, function(val) { return val !== ""; });
  loadPath(__dirname, optionPath, function(options) {
    res.set('Content-Type', 'text/html');
    res.send(options);
  });
};