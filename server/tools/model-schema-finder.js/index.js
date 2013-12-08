/**
 */
var express = require('express')
  , api = express()
  , http = require('http')
  , fs = require('fs')
var schemaDir;
/**
 *
 * @param req
 * @param res
 */
var schemaFinder = function(req, res) {
  req.route.split('.')
};
/**
 *
 * @param directory
 * @returns {Function}
 */
module.exports = function(model, directory) {
  schemaDir = directory;
  api.get(model.modelName + '/:schema', schemaFinder)
  return api;
};
