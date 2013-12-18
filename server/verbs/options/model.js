/**
 * OPTIONS Verb
 */
module.exports = function(resource_path, model) {
  var schema_gen = require('../../tools/json-schema-generator/model.generator');
  var schema = schema_gen(resource_path, model);
  var optionsFunc = function(req, res) {
    res.set('Content-Type', 'application/json');
    res.json(schema);
  };
  return optionsFunc;
}