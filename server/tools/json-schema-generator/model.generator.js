/**
 * Dependencies
 * @type {exports}
 */
var q = require('q')
  , _ = require('underscore')
  , path = require('path')
  , resourceName = require('./helpers/resourceName')
/**
 * Get the name of a function, without invoking it
 * @param fun
 * @returns {*}
 */
var functionName = function(fun) {
  if (_.isUndefined(fun)) {
    return 'String';
  }
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
};
/**
 * Converting Mongoose model paths & schema into Collection+JSON data
 * @param model
 * @param types
 * @param postFix
 * @param description
 * @returns {{}}
 */
var getProperties = function(model, types, postFix, description) {
  var data = {}
    , schemas = model.schema.paths;
  postFix = _.isUndefined(postFix) ? '' : postFix;
  description = _.isUndefined(description) ? '' : description;
  for(mpath in schemas) {
    if (mpath == '__v') {
      continue;
    }
    var schema = schemas[mpath];
    var type = functionName(schema.options.type);
    if (types.length > 0 && !_.contains(types, type)) {
      continue;
    }
    var d = {
      title: mpath,
      description: mpath + ' ' + description,
      identity: mpath == '_id' ? true : false,
      readonly: mpath == '_id' ? true : false
      //required: true
    };
    if (type == 'String') {
      //      d.maxLength = 100;
      //      d.minLength = 0;
    }
    switch(type) {
      case 'Date':
        type = 'date-time';
        break;
      case 'ObjectId':
        type = 'string';
        break;
      case 'Mixed':
        type = 'any';
        break;
      case 'Boolean':
        type = 'boolean';
        break;
      default:
        type = 'array';
    }
    d.type = type;
    if (!_.isEmpty(schema.enumValues)) {
      d.enum = schema.enumValues;
      d.type = "string";
    }
    data[mpath + postFix] = d;
  }
  return data;
};
/**
 * Converting model to Collection+JSON Template
 * @param model
 * @returns {Array}
 */
var getLinks = function(resource_path, model) {
  var links = [];
  links.push({
    title: model.modelName + "s",
    rel: "self",
    href: path.join('/api/v1/resources', resourceName(model))
  });
  links.push({
    title: "This " + model.modelName,
    rel: "self",
    href: path.join('/api/v1/resources', resourceName(model), "{{_id}}")
  });
  links.push({
    title: 'Delete this ' + model.modelName,
    rel: "destroy",
    method: "DELETE",
    href: path.join('/api/v1/resources', resourceName(model), "{{_id}}")
  });
  links.push({
    title: 'Update this ' + model.modelName,
    rel: "update",
    method: "PUT",
    href: path.join('/api/v1/resources', resourceName(model), "{{_id}}"),
    properties: getProperties(model, ['String', 'Number', 'Date', 'Mixed', 'Boolean'])
  });
  return links;
};
/**
 *
 * @param model_path
 * @param model
 */
var generateSchema = function(model_path, model) {
  var links = getLinks(model_path, model);
  return {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "title": resourceName(model),
    "name": resourceName(model),
    "description": "A single " + model.modelName + " instance",
    "properties": getProperties(model, []),
    "links": links
  };
};
/**
 * Exporting functionality
 * @type {Function}
 */
module.exports = generateSchema;
