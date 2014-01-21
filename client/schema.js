angular.module('schema', ['ngResource', 'clientUtilities'])
  .config(function($httpProvider) {
    /**
     * Intercept location changes so updating api endpoint
     */
    var interceptor = ['$rootScope', '$q', '$location', 'jsonClient', 'base64',
      function(rootScope, $q, $location, jsonClient, base64) {
        rootScope.$on('$locationChangeSuccess', function() {
          rootScope.actualLocation = $location.path();
        });
        rootScope.$watch(function() {
          return $location.path()
        }, function(newLocation, oldLocation) {
          if (rootScope.actualLocation === newLocation) {
            jsonClient().buildClient(newLocation);
          }
        });
        var success = function(response) {
          var client = jsonClient();
          var headers = response.headers();
          if (angular.isDefined(headers['x-username'])
            && angular.isDefined(headers['x-token'])) {
            client.setHeader('Authorization', null);
            var token = base64.encode(headers['x-username'] + ':' + headers['x-token']);
            client.setHeader('Token', token);
            sessionStorage.token = token;
          }
          return response;
        };
        var error = function(response) {
          var status = response.status;
          if (status == 300) {
            var client = jsonClient();
            var headers = response.headers();
            var url = headers.location;
            if (angular.isDefined(headers['x-username'])
              && angular.isDefined(headers['x-token'])) {
              client.setHeader('Authorization', null);
              var token = base64.encode(headers['x-username'] + ':' + headers['x-token']);
              client.setHeader('Token', token);
              sessionStorage.token = token;
            }
            client.buildClient(url);
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
  .filter('semantics', function() {
    return function(links, semantics) {
      var filtered = [];
      angular.forEach(links, function(link) {
        angular.forEach(semantics, function(value, key) {
          if (angular.isDefined(link._link) && link._link[key] == value) {
            filtered.push(link);
          }
        });
      });
      return filtered;
    };
  })
  .factory('jsonClient', function() {
    var apiClient = {};
    return function() {
      return apiClient;
    }
  })
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function(a, b) {
        return (a[field] > b[field]);
      });
      if (reverse) {
        filtered.reverse();
      }
      return filtered;
    };
  })
  .filter('filterObjectBy', function() {
    return function(items, filter) {
      var filtered = {};
      angular.forEach(items, function(item, key) {
        var pass = true;
        angular.forEach(filter, function(fVal, fKey) {
          if (item[fKey] != fVal) {
            pass = false;
          }
        });
        if (pass) {
          filtered[key] = item;
        }
      });
      return filtered;
    };
  })
  .factory('debounce', ['$timeout', function($timeout) {
    /**
     * calling fn once after timeout no matter how many calls made, within timeout
     * @param {Function} fn to debounce
     * @param {Number} timeout
     * @param {boolean} apply will be passed to $timeout
     * @returns {Function} callable
     */
    function debounce(fn, timeout, apply) {
      timeout = angular.isUndefined(timeout) ? 0 : timeout;
      apply = angular.isUndefined(apply) ? true : apply;
      var nthCall = 0;
      return function() { // intercepting fn
        var that = this;
        var argz = arguments;
        nthCall++;
        var later = (function(version) {
          return function() {
            if (version === nthCall) {
              return fn.apply(that, argz);
            }
          };
        })(nthCall);
        return $timeout(later, timeout, apply);
      };
    }

    return debounce;
  }])
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
        if (link._link.rel === rel) {
          deferred.resolve(link);
        }
      });
      return deferred.promise;
    }
    apiClient.setCredentials = function(username, token) {
      apiClient.setHeader('Authorization', null);
      apiClient.setHeader('Token', base64.encode(username + ':' + token));
    };
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
            , rootDataCopy = angular.copy(root.data)
            , data = {};
          apiClient.compileLink(root, rootDataCopy, data, pathPartsCopy, schema.links[l]);
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
    apiClient.compileLink = function(root, wholeData, data, pathParts, link) {
      if (pathParts.length === 0) {
        var eLink = angular.copy(link)
          , flatLink = JSON.stringify(eLink)
          , flatLinkInterpolater = $interpolate(flatLink);
        flatLink = flatLinkInterpolater(wholeData);
        eLink = {};
        eLink._link = JSON.parse(flatLink);
        angular.extend(eLink, data);
        if (!angular.isArray(root.links)) {
          root.links = [];
        }
        root.links.push(eLink);
        return;
      }
      var seg = pathParts.shift();
      if (angular.isArray(wholeData[seg])) {
        for(var n in wholeData[seg]) {
          var d = angular.copy(wholeData[seg][n])
            , aLink = angular.copy(link);
          angular.extend(wholeData, wholeData[seg][n]);
          apiClient.compileLink(root, wholeData, d, angular.copy(pathParts), aLink);
        }
      }
      if (!angular.isArray(wholeData[seg]) && angular.isObject(wholeData[seg])) {
        var d = angular.copy(wholeData[seg])
          , lLink = angular.copy(link);
        angular.extend(wholeData, wholeData[seg]);
        apiClient.compileLink(root, wholeData, d, angular.copy(pathParts), lLink);
      }
    }
    /**
     * Using the OPTIONS method on a URL to find schema
     * @param url
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.resolveSchema = function(url) {
      var deferred = $q.defer();
      $http({method: 'OPTIONS', url: url}).success(function(schema, status, headers, config) {
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
    apiClient.staticHeaders = {};
    apiClient.buildClient = function(url) {
      var def = $q.defer();
      apiClient.data = {};
      apiClient.setHeader('Token', sessionStorage.token);
      apiClient.resolveSchema(url).then(function(schema) {
        apiClient.schema = schema;
        apiClient.origSchema = angular.copy(schema);
        apiClient.links = schema.links;
        apiClient.resourceURLTraverse(url, {}, {'GET': {method: 'GET', headers: apiClient.staticHeaders}}, 'GET', {}).then(function(data) {
          apiClient.data = data;
          apiClient.links = [];
          apiClient.resolveEmbeddedLinks(apiClient, apiClient.schema);
          apiClient.interpolateWholeSchema(apiClient.schema, data);
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
        apiClient.resolveSchema(link._link.href).then(function(schema) {
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
      apiClient.findRelLink(rel, apiClient.links).then(function(link) {
        apiClient.link(link, params).then(function(data) {
          apiClient.data = data;
          if (link._link.target === 'nofollow') {
            deferred.resolve(apiClient);
            return;
          }
          if (link._link.target === 'refresh') {
            apiClient.schema = schema;
            apiClient.links = [];
            apiClient.resolveEmbeddedLinks(apiClient, apiClient.origSchema);
            apiClient.interpolateWholeSchema(apiClient.origSchema, data);
            deferred.resolve(apiClient);
            return;
          }
          apiClient.options(rel, params).then(function(schema) {
            apiClient.schema = schema;
            apiClient.origSchema = angular.copy(schema);
            apiClient.links = [];
            apiClient.resolveEmbeddedLinks(apiClient, apiClient.schema);
            apiClient.interpolateWholeSchema(apiClient.schema, data);
            deferred.resolve(apiClient);
          });
        }, function() {
        });
      });
      return deferred.promise;
    };
    /**
     * Interpolate data across entire schema: useful for dynamic titles, and non link dynamism
     * @param schema
     * @param data
     */
    apiClient.interpolateWholeSchema = function(schema, data) {
      flatSchema = JSON.stringify(schema);
      flatSchemaInterpolator = $interpolate(flatSchema);
      flatSchema = flatSchemaInterpolator(data);
      apiClient.schema = JSON.parse(flatSchema);
    };
    /**
     * Performing an HTTP METHOD to a given link using params for interpolation,
     * but not updating the schema (as traverse does)
     * @param link
     * @param params
     * @param addHeaders
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.link = function(link, params, addHeaders) {
      var deferred = $q.defer();
      // Setting up link
      var eLink = angular.copy(link);
      var method = eLink._link.method ? eLink._link.method : 'GET'
        , methods = {}
        , defaults = {}
        , headers = {
          'Content-Type': 'application/json'
        };
      // Validate against link schema
      var payload = {};
      angular.forEach(eLink._link.properties, function(propertyConfig, propertyName) {
        payload[propertyName] = params[propertyName];
      });
      angular.extend(headers, apiClient.staticHeaders, addHeaders);
      methods[method] = {
        method: method,
        headers: headers
      };
      angular.forEach(eLink._link.properties, function(config, prop) {
        defaults[prop] = angular.isDefined(config.default) ? config.default : null;
      });
      // Now doing the link traversal
      apiClient.resourceURLTraverse(eLink._link.href, defaults, methods, method, payload, eLink._link.target).then(
        function(response) {
          deferred.resolve(response);
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
     * @param target
     * @returns {adapter.pending.promise|*|promise|Q.promise}
     */
    apiClient.responseHeaders = {};
    apiClient.resourceURLTraverse = function(url, defaults, methods, method, payload, target) {
      var deferred = $q.defer();
      if (target === 'new') {
        window.open('#' + url);
        deferred.reject({});
      } else {
        var resource = $resource(url, defaults, methods);
        resource[method](payload, function(response, headersFunc) {
          var headers = headersFunc();
          if (angular.isDefined(headers['x-username'])
            && angular.isDefined(headers['x-token'])) {
            apiClient.setHeader('Authorization', null);
            var token = base64.encode(response.headers()['x-username'] + ':' + response.headers()['x-token']);
            apiClient.setHeader('Token', token);
            sessionStorage.token = token;
          }
          apiClient.responseHeaders = headers;
          if (target !== 'nofollow' && target !== 'refresh') {
            $location.path(url);
            apiClient.url = url;
          }
          deferred.resolve(response);
        });
      }
      return deferred.promise;
    };
    return apiClient.buildClient;
  });

