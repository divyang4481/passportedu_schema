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
  var admin = function(req, res, next) {
    var authToken = req.get('Token');
    console.log(authToken);
    if (authToken == 'poopie') {
      next();
    } else {
      res.set('Location', '/api/v1');
      res.send(300);
    }
  };
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
  api.options(models_path, admin, optionsMs(models_path, model));
  api.get(models_path, admin, function(req, res) {
    queryM(model)(req, function(err, data) {
      res.json(data);
    });
  });
  api.post(models_path, admin, postM(model));
  // Individual model
  api.options(model_path_id, admin, optionsM(model_path_id, model));
  api.get(model_path_id, admin, getM(model));
  api.put(model_path_id, admin, putM(model));
  api.delete(model_path_id, admin, deleteM(model));
  //      api.head('*', headM(models));
  return api;
};
module.exports = rest;