var fs = require('fs')
  , express = require('express')
  , q = require('q')
/**
 * Loading schemas into an array
 * @param dir
 * @returns {promise|*|Function|promise|promise}
 */
function loadSchemas(dir) {
  var schemas = []
    , deferred = q.defer();
  fs.readdir(dir, function(err, files) {
    for(file in files) {
      schemas.push(require(dir + '/' + files[file]));
    }
    deferred.resolve(schemas);
  });
  return deferred.promise;
}
module.exports = function(dir) {
  var deferred = q.defer();
  var promises = [];
  loadSchemas(dir).then(function(schemas) {
    _.each(schemas, function(schema) {


    });
  });
  return deferred.promise;
}