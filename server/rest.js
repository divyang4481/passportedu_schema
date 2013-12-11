/*
 Dependencies
 */
var express = require('express')
  , api = express()
  , _ = require('underscore')
  , fs = require('fs')
  , q = require('q')
  , path = require('path')
  , resourceName = require('./tools/json-schema-generator/helpers/resourceName')
  , root_generator = require('./tools/json-schema-generator/root.generator.js')
/*
 VERB modules
 */
var optionsM = require('./verbs/options')
  , getM = require('./verbs/get')
  , queryM = require('./verbs/query')
  , postM = require('./verbs/post')
  , putM = require('./verbs/put')
  , deleteM = require('./verbs/delete')
  , headM = require('./verbs/head');
/**
 * Parse the JSON body
 */
api.use(express.json());
api.use(express.urlencoded());
/**
 * Main method
 */
var rest = function(model) {
  var model_path = "/"
    , model_path_id = "/:id";
  api.options(model_path, optionsM(model_path, model));
  api.options(model_path_id, optionsM(model_path_id, model));
  api.get(model_path_id, getM(model));
  api.get(model_path, queryM(model));
  api.put(model_path_id, putM(model));
  api.post(model_path, postM(model));
  api.delete(model_path_id, deleteM(model));
  //      api.head('*', headM(models));
  return api;
};
module.exports = rest;