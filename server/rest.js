
/**
 * Main method
 */
var rest = function(model) {
  var express = require('express')
    , api = express();
  /**
   * Parse the JSON body
   */
  api.use(express.json());
  api.use(express.urlencoded());
  /*
   VERB modules
   */
  var optionsM = require('./verbs/options/model')
    , optionsMs = require('./verbs/options/models')
    , getM = require('./verbs/get')
    , queryM = require('./verbs/query')
    , postM = require('./verbs/post')
    , putM = require('./verbs/put')
    , deleteM = require('./verbs/delete')
    , headM = require('./verbs/head')
    , models_path = "/"
    , model_path_id = "/:id";
  // Models
  api.options(models_path, optionsMs(models_path, model));
  api.get(models_path, function(req, res) {
    queryM(model)(req, function(err, data) {
      res.json(data);
    });
  });
  api.post(models_path, postM(model));
  // Individual model
  api.options(model_path_id, optionsM(model_path_id, model));
  api.get(model_path_id, getM(model));
  api.put(model_path_id, putM(model));
  api.delete(model_path_id, deleteM(model));
  //      api.head('*', headM(models));
  return api;
};
module.exports = rest;