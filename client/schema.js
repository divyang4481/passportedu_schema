angular.module('schema', ['ngResource'])
  .config(function($interpolateProvider) {
  })
  .factory('jsonSchema', function($resource, $interpolate, $q, $http) {
    function findRelLink(rel, links) {
      var deferred = $q.defer();
      angular.forEach(links, function(link) {
        if (link.rel === rel) {
          deferred.resolve(link);
        }
      });
      return deferred.promise;
    }

    function resolveEmbeddedLinks(root, schema, path) {
      if (angular.isUndefined(path)) {
        path = [];
      }
      var addPath
      if (angular.isDefined(schema.properties)) {
        for(var p in schema.properties) {
          addPath = angular.copy(path);
          addPath.push(p);
          resolveEmbeddedLinks(root, schema.properties[p], addPath);
        }
      }
      if (angular.isDefined(schema.items)) {
        addPath = angular.copy(path);
        resolveEmbeddedLinks(root, schema.items, addPath);
      }
      if (angular.isDefined(schema.links)) {
        for(var l in schema.links) {
          compileLink(root, root.data, path, schema.links[l]);
        }
      }
    }

    function compileLink(root, data, path, link) {
      if (path.length === 0) {
        var eLink = angular.copy(link)
          , href = $interpolate(eLink.href)
          , url = href(data);
        eLink.href = url;
        if (!angular.isArray(root.links)) {
          root.links = [];
        }
        root.links.push(eLink);
        return;
      }
      var seg = path.shift();
      if (angular.isArray(data[seg])) {
        for(var n in data[seg]) {
          var d = angular.copy(data)
            , aLink = angular.copy(link);
          angular.extend(d, data[seg][n]);
          aLink.rel = aLink.rel + '_' + n;
          compileLink(root, d, angular.copy(path), aLink);
        }
      }
      if (!angular.isArray(data[seg]) && angular.isObject(data[seg])) {
        var d = angular.copy(data)
          , lLink = angular.copy(link);
        angular.extend(d, data[seg]);
        lLink.rel = lLink.rel + '_' + seg;
        compileLink(root, d, angular.copy(path), lLink);
      }
    }

    function resolveSchema(url) {
      var deferred = $q.defer();
      $http({method: "OPTIONS", url: url}).success(function(schema, status, headers, config) {
        deferred.resolve(schema);
      }).error(function(data, status, headers, config) {
          console.error(data, status, headers);
        });
      return deferred.promise;
    }

    function buildClient(url) {
      var def = $q.defer()
        , self = this
        , staticHeaders = {};
      self.data = {};
      self.curies = [];
      resolveSchema(url).then(function(schema) {
        self.schema = schema;
        self.links = [];
        resolveEmbeddedLinks(self, self.schema);
        def.resolve(self);
      });
      this.setHeader = function(headerName, headerValue) {
        staticHeaders[headerName] = headerValue;
      };
      this.options = function(path, params) {
        var deferred = $q.defer()
          , payload = {};
        angular.extend(payload, params, self.data);
        findRelLink(path, self.links).then(function(link) {
          resolveSchema(link.href).then(function(schema) {
            deferred.resolve(schema);
          });
        });
        return deferred.promise;
      };
      this.traverse = function(path, params) {
        var deferred = $q.defer();
        self.options(path, params).then(function(schema) {
          self.link(path, params).then(function(data) {
            self.data = data;
            self.schema = schema;
            self.links = [];
            resolveEmbeddedLinks(self, self.schema);
            deferred.resolve(self);
          });
        });
        return deferred.promise;
      };
      this.link = function(path, params, addHeaders) {
        var deferred = $q.defer();
        findRelLink(path, self.links).then(function(link) {
          var href = $interpolate(link.href)
            , url = href(payload)
            , method = link.method ? link.method : 'GET'
            , methods = {}
            , defaults = {}
            , headers = {
              "Content-Type": "application/json"
            }
            , httpConfig;
          var payload = {};
          for(var p in link.properties) {
            payload[p] = link.properties[p].value;
          }
          angular.extend(payload, params);
          methods[method] = {
            method: method,
            headers: headers
          };
          angular.forEach(link.properties, function(config, prop) {
            defaults[prop] = angular.isDefined(config.default) ? config.default : null;
          });
          angular.extend(headers, staticHeaders, addHeaders);
          $resource(url, defaults, methods)[method](payload, function(response) {
            angular.extend(self.data, response);
            deferred.resolve(response);
          });
        });
        return deferred.promise;
      }
      return def.promise;
    }

    return buildClient;
  });

