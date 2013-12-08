angular.module('schemaCrawler', ['ngResource'])
  .factory('jsonSchema', function($resource, $q) {

    function traversePaths(root, paths) {
      var path = paths.shift();
      if (angular.isUndefined(path)) {
        return root;
      }
      return traversePaths(root[path], paths);
    }

    function resourcify(link, schema) {
      var verb = (link.method ? link.method : 'GET');
      var verbs = {};
      verbs[verb.toLowerCase()] = {
        method: verb
      }
      var params = {};
      var res = $resource(link.href, params, verbs);
      res.form = {};
      if(angular.isObject(schema.properties)) {
        res.form = schema.properties;
      }
      return res;
    }

    var $options = function(uri) {
      return $resource(uri, {}, {
        options: {method: 'OPTIONS'}
      });
    }
    var Schema = function(uri) {
      var promises = []
        , deferred = $q.defer()
        , self = {};
      self.links = {};
      self.properties = {};
      $options(uri).options(function(topSchema) {
        self.definition = topSchema.definition;
        self.properties = topSchema.properties;
        for(rel in topSchema.links) {
          promises.push($q.defer())
        }
        for(rel in topSchema.links) {
          var link = topSchema.links[rel];
          var action = angular.isDefined(link.method) ? link.method : 'GET';
          var href = link.href;
          var schema = link.schema;
          if (angular.isUndefined(schema)) {
            var promise = Schema(href).then(function(subSchema) {
              schema = subSchema;
              self.links[rel] = resourcify(link, schema)
            });
            promises.push(promise);
            continue;
          }
          var $ref = schema['$ref'];
          if (angular.isDefined($ref)) {
            if ($ref.match(/^#/)) {
              angular.extend(schema, traversePaths(topSchema, $ref.replace(/#\//, '').split('/')));
              self.links[rel] = resourcify(link, schema)
            } else {
              var promise = Schema($ref).then(function(subSchema) {
                schema = subSchema;
                self.links[rel] = resourcify(link, schema);
              });
              promises.push(promise);
            }
          }
          self.links[rel] = resourcify(link, schema)
        }
        $q.all(promises).then(function() {
          deferred.resolve(self);
        })
      });
      return deferred.promise;
    };
    return function(rootURI) {
      return Schema(rootURI);
    };
  });