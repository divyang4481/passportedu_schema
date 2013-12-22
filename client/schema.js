angular.module('schema', ['ngResource'])
  .config(function($httpProvider) {
    var interceptor = ['$rootScope', '$q', 'jsonClient', function(rootScope, $q, jsonClient) {
      var apiClient = jsonClient();

      function success(response) {
        return response;
      }

      function error(response) {
        var status = response.status;
        if (status == 300) {
          var url = response.headers().location;
          apiClient.resolveSchema(url).then(function(schema) {
            apiClient.schema = schema;
            apiClient.resourceURLTraverse(url, {}, {'GET': {method: 'GET'}}, 'GET', {}).then(function(data) {
              apiClient.data = data;
              apiClient.links = [];
              apiClient.resolveEmbeddedLinks(apiClient, apiClient.schema);
            });
          });
        }
        if (status == 401) {
          return;
        }
        // otherwise
        return $q.reject(response);
      }

      return function(promise) {
        return promise.then(success, error);
      }
    }];
    $httpProvider.responseInterceptors.push(interceptor);
  })
  .factory('jsonClient', function() {
    var apiClient = {};
    return function() {
      return apiClient;
    }
  })
  .factory('jsonSchema', function($resource, $interpolate, $q, $http, jsonClient) {
    var apiClient = jsonClient();
    apiClient.findRelLink = function(rel, links) {
      var deferred = $q.defer();
      angular.forEach(links, function(link) {
        if (link.rel === rel) {
          deferred.resolve(link);
        }
      });
      return deferred.promise;
    }
    apiClient.resolveEmbeddedLinks = function(root, schema, pathParts) {
      if (angular.isUndefined(pathParts)) {
        pathParts = [];
      }
      var addPath
      if (angular.isDefined(schema.properties)) {
        for(var p in schema.properties) {
          addPath = angular.copy(pathParts);
          addPath.push(p);
          apiClient.resolveEmbeddedLinks(root, schema.properties[p], addPath);
        }
      }
      if (angular.isDefined(schema.items)) {
        addPath = angular.copy(pathParts);
        apiClient.resolveEmbeddedLinks(root, schema.items, addPath);
      }
      if (angular.isDefined(schema.links)) {
        for(var l in schema.links) {
          var pathPartsCopy = angular.copy(pathParts)
            , rootDataCopy = angular.copy(root.data);
          apiClient.compileLink(root, rootDataCopy, pathPartsCopy, schema.links[l]);
        }
      }
    }
    apiClient.compileLink = function(root, data, pathParts, link) {
      if (pathParts.length === 0) {
        var eLink = angular.copy(link)
          , href = $interpolate(eLink.href)
          , title = eLink.title ? $interpolate(eLink.title): ''
          , rel = $interpolate(eLink.rel)
          , iHref = href(data)
          , iTitle = title(data)
          , iRel = rel(data)
        eLink.href = iHref;
        eLink.rel = iRel;
        eLink.title = iTitle;
        if (!angular.isArray(root.links)) {
          root.links = [];
        }
        root.links.push(eLink);
        return;
      }
      var seg = pathParts.shift();
      if (angular.isArray(data[seg])) {
        for(var n in data[seg]) {
          var d = angular.copy(data)
            , aLink = angular.copy(link);
          angular.extend(d, data[seg][n]);
          aLink.rel = aLink.rel;
          apiClient.compileLink(root, d, angular.copy(pathParts), aLink);
        }
      }
      if (!angular.isArray(data[seg]) && angular.isObject(data[seg])) {
        var d = angular.copy(data)
          , lLink = angular.copy(eLink);
        angular.extend(d, data[seg]);
        lLink.rel = lLink.rel + '_' + seg;
        apiClient.compileLink(root, d, angular.copy(pathParts), lLink);
      }
    }
    apiClient.resolveSchema = function(url) {
      var deferred = $q.defer();
      $http({method: "OPTIONS", url: url}).success(function(schema, status, headers, config) {
        deferred.resolve(schema);
      }).error(function(data, status, headers, config) {
          console.error(data, status, headers);
        });
      return deferred.promise;
    }
    apiClient.buildClient = function(url) {
      var def = $q.defer();
      apiClient.staticHeaders = {};
      apiClient.data = {};
      apiClient.curies = [];
      apiClient.resolveSchema(url).then(function(schema) {
        apiClient.schema = schema;
        apiClient.links = schema.links;
        apiClient.traverse('self', {}).then(function() {
          def.resolve(apiClient);
        });
      });
      apiClient.setHeader = function(headerName, headerValue) {
        apiClient.staticHeaders[headerName] = headerValue;
      };
      apiClient.options = function(rel, params) {
        var deferred = $q.defer()
          , payload = {};
        angular.extend(payload, params, apiClient.data);
        apiClient.findRelLink(rel, apiClient.links).then(function(link) {
          apiClient.resolveSchema(link.href).then(function(schema) {
            deferred.resolve(schema);
          });
        });
        return deferred.promise;
      };
      apiClient.traverse = function(rel, params) {
        var deferred = $q.defer();
        apiClient.options(rel, params).then(function(schema) {
          apiClient.link(rel, params).then(function(data) {
            apiClient.data = data;
            apiClient.schema = schema;
            apiClient.links = [];
            apiClient.resolveEmbeddedLinks(apiClient, apiClient.schema);
            deferred.resolve(apiClient);
          });
        });
        return deferred.promise;
      };
      apiClient.link = function(rel, params, addHeaders) {
        var deferred = $q.defer();
        apiClient.findRelLink(rel, apiClient.links).then(function(link) {
          var eLink = angular.copy(link)
            , href = $interpolate(eLink.href)
            , title = $interpolate(eLink.title)
            , rel = $interpolate(eLink.rel)
            , iHref = href(payload)
            , iTitle = title(params)
            , iRel = rel(params)
          eLink.href = iHref;
          eLink.rel = iRel;
          eLink.title = iTitle;
          var method = eLink.method ? eLink.method : 'GET'
            , methods = {}
            , defaults = {}
            , headers = {
              "Content-Type": "application/json"
            };
          var payload = {};
          for(var p in eLink.properties) {
            payload[p] = eLink.properties[p].value;
          }
          angular.extend(payload, params);
          angular.extend(headers, apiClient.staticHeaders, addHeaders);
          methods[method] = {
            method: method,
            headers: headers
          };
          angular.forEach(eLink.properties, function(config, prop) {
            defaults[prop] = angular.isDefined(config.default) ? config.default : null;
          });
          apiClient.resourceURLTraverse(eLink.href, defaults, methods, method, payload).then(function(response) {
            deferred.resolve(response);
          });
        });
        return deferred.promise;
      }
      apiClient.resourceURLTraverse = function(url, defaults, methods, method, payload) {
        var deferred = $q.defer();
        var resource = $resource(url, defaults, methods);
        resource[method](payload, function(response) {
          apiClient.data = response;
          deferred.resolve(response);
        });
        return deferred.promise;
      }
      return def.promise;
    }
    return apiClient.buildClient;
  });

