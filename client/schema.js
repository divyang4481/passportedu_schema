angular.module('schema', ['ngResource'])
  .config(function($httpProvider) {
    var interceptor = ['$rootScope', '$q', '$location', 'jsonClient', function(rootScope, $q, $location, jsonClient) {
      var apiClient = jsonClient();
      rootScope.$on('$locationChangeSuccess', function() {
        rootScope.actualLocation = $location.path();
      });

      rootScope.$watch(function () {return $location.path()}, function (newLocation, oldLocation) {
        if(rootScope.actualLocation === newLocation) {
          apiClient.buildClient(newLocation);
        }
      });
      var success = function(response) {
        return response;
      };
      var error = function(response) {
        var status = response.status;
        if (status == 300) {
          var url = response.headers().location;
          apiClient.buildClient(url);
        }
        if (status == 415) {
          apiClient.errors = [
            {
              message: "Please choose the correct mediaType and resubmit"
            }
          ];
        }
        // otherwise
        return $q.reject(response);
      };
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
  .factory('jsonSchema', function($resource, $interpolate, $q, $http, $location, jsonClient) {
    var apiClient = jsonClient();
    /**
     * Finding the link object identified by the rel from an array of link objects
     * @param rel
     * @param links
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.findRelLink = function(rel, links) {
      var deferred = $q.defer();
      angular.forEach(links, function(link) {
        if (link.rel === rel) {
          deferred.resolve(link);
        }
      });
      return deferred.promise;
    }
    /**
     * Traversing schemas/sub-schemas to compile and interpolate curied links and links
     * @param root
     * @param schema
     * @param pathParts
     */
    apiClient.resolveEmbeddedLinks = function(root, schema, pathParts) {
      if (angular.isUndefined(pathParts)) {
        // Initialize a persistent path reference
        pathParts = [];
      }
      var addPath;
      if (angular.isDefined(schema.links)) {
        for(var l in schema.links) {
          var pathPartsCopy = angular.copy(pathParts)
            , rootDataCopy = angular.copy(root.data);
          apiClient.compileLink(root, rootDataCopy, pathPartsCopy, schema.links[l]);
        }
      }
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
    }
    /**
     * Compiling a link by combining a link object with it's correlated data
     * @param root
     * @param data
     * @param pathParts
     * @param link
     */
    apiClient.compileLink = function(root, data, pathParts, link) {
      if (pathParts.length === 0) {
        var eLink = angular.copy(link)
          , flatLink = JSON.stringify(eLink)
          , flatLinkInterpolater = $interpolate(flatLink);
        flatLink = flatLinkInterpolater(data);
        eLink = JSON.parse(flatLink);
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
          angular.extend(aLink, data[seg][n]);
          apiClient.compileLink(root, d, angular.copy(pathParts), aLink);
        }
      }
      if (!angular.isArray(data[seg]) && angular.isObject(data[seg])) {
        var d = angular.copy(data)
          , lLink = angular.copy(link);
        angular.extend(d, data[seg]);
        lLink.rel = lLink.rel;
        angular.extend(lLink, data[seg]);
        apiClient.compileLink(root, d, angular.copy(pathParts), lLink);
      }
    }
    /**
     * Useing the OPTIONS method on a URL to find schema
     * @param url
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.resolveSchema = function(url) {
      var deferred = $q.defer();
      $http({method: "OPTIONS", url: url}).success(function(schema, status, headers, config) {
        deferred.resolve(schema);
      }).error(function(data, status, headers, config) {
          console.error(data, status, headers);
        });
      return deferred.promise;
    }
    /**
     * Building the client App:
     * Main method of this Service,
     * Crawling schema to build a dynamic client, conforming to schema descriptors
     * @param url
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.buildClient = function(url) {
      var def = $q.defer();
      apiClient.staticHeaders = {};
      apiClient.data = {};
      apiClient.curies = [];
      apiClient.resolveSchema(url).then(function(schema) {
        apiClient.schema = schema;
        apiClient.links = schema.links;
        apiClient.resourceURLTraverse(url, {}, {'GET': {method: 'GET'}}, 'GET', {}).then(function(data) {
          apiClient.data = data;
          apiClient.links = [];
          apiClient.resolveEmbeddedLinks(apiClient, apiClient.schema);
          flatSchema = JSON.stringify(schema);
          flatSchemaInterpolator = $interpolate(flatSchema);
          flatSchema = flatSchemaInterpolator(data);
          apiClient.schema = JSON.parse(flatSchema);
          def.resolve(apiClient);
        });
      });
      return def.promise;
    };
    /**
     * Setting a static header, which will be reused on all future HTTP requests
     * Good for saving Authentication headers
     * @param headerName
     * @param headerValue
     */
    apiClient.setHeader = function(headerName, headerValue) {
      apiClient.staticHeaders[headerName] = headerValue;
    };
    /**
     *Updating the clients OPTIONS( Schema ) given a specific link rel and some parameters to use for interpolation
     * @param rel
     * @param params
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
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
    /**
     * Traversing to the Schema of the given rel link
     * @param rel
     * @param params
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.traverse = function(rel, params) {
      var deferred = $q.defer();
      apiClient.options(rel, params).then(function(schema) {
        apiClient.link(rel, params).then(function(data) {
          apiClient.data = data;
          apiClient.schema = schema;
          apiClient.links = [];
          apiClient.resolveEmbeddedLinks(apiClient, apiClient.schema);
          flatSchema = JSON.stringify(schema);
          flatSchemaInterpolator = $interpolate(flatSchema);
          flatSchema = flatSchemaInterpolator(data);
          apiClient.schema = JSON.parse(flatSchema);
          deferred.resolve(apiClient);
        });
      });
      return deferred.promise;
    };
    /**
     * Performing an HTTP METHOD to a given rel/link using params for interpolation,
     * but not updating the schema (as traverse does)
     * @param rel
     * @param params
     * @param addHeaders
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.link = function(rel, params, addHeaders) {
      var deferred = $q.defer();
      apiClient.findRelLink(rel, apiClient.links).then(function(link) {
        var eLink = angular.copy(link)
          , flatLink = JSON.stringify(eLink)
          , flatLinkInterpolater = $interpolate(flatLink);
        flatLink = flatLinkInterpolater(params);
        eLink = JSON.parse(flatLink);
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
    /**
     * Using the angular $resource service to perform a link traversal
     * @param url
     * @param defaults
     * @param methods
     * @param method
     * @param payload
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.resourceURLTraverse = function(url, defaults, methods, method, payload) {
      $location.path(url);
      apiClient.url = url;
      var deferred = $q.defer();
      var resource = $resource(url, defaults, methods);
      resource[method](payload, function(response) {
        apiClient.data = response;
        deferred.resolve(response);
      });
      return deferred.promise;
    }
    return apiClient.buildClient;
  })
  .filter('navLinks', function() {
    return function(links) {
    }
  });

