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
    };
    function resolveEmbeddedLinks(root, schema, path) {
      if (angular.isUndefined(path)) {
        path = '';
      }
      if (angular.isDefined(schema.properties)) {
        for(p in schema.properties) {
          path = path + '.' + p;
          resolveEmbeddedLinks(root, schema.properties[p], path);
        }
      }
      if (angular.isDefined(schema.items)) {
        path = path + '[]';
        resolveEmbeddedLinks(root, schema.items, path);
      }
      if (angular.isDefined(schema.links)) {
        for(l in schema.links) {
          root.links.push({
            'rel': path,
            'href': schema.links[l].href
          });
        }
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
    };
    return function(url) {
      var def = $q.defer()
        , self = this
        , staticHeaders = {};
      self.data = {};
      resolveSchema(url).then(function(schema) {
        self.schema = schema;
        def.resolve(self);
      });
      this.setHeader = function(headerName, headerValue) {
        staticHeaders[headerName] = headerValue;
      };
      this.options = function(path, params) {
        var deferred = $q.defer()
          , payload = {};
        angular.extend(payload, params, self.data);
        findRelLink(path, self.schema.links).then(function(link) {
          var href = $interpolate(link.href)
            , url = href(payload);
          resolveSchema(url).then(function(schema) {
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
            resolveEmbeddedLinks(self.schema, self.schema);
            deferred.resolve(self);
          });
        });
        return deferred.promise;
      };
      this.link = function(path, params, addHeaders) {
        var deferred = $q.defer()
          , payload = {};
        angular.extend(payload, params, self.data);
        findRelLink(path, self.schema.links).then(function(link) {
          var href = $interpolate(link.href)
            , url = href(payload)
            , method = link.method ? link.method : 'GET'
            , methods = {}
            , parameters = {}
            , targetSchema = link.targetSchema
            , headers = {
              "Content-Type": "application/json"
            }
            , httpConfig;
          methods[method.toLowerCase()] = {
            method: method
          };
          angular.forEach(link.properties, function(config, prop) {
            parameters[prop] = config.default ? config.default : null;
          });
          angular.extend(headers, staticHeaders, addHeaders);
          httpConfig = {
            headers: headers,
            method: method,
            url: url,
            data: params,
            responseType: 'json'
          };
          $http(httpConfig)
            .success(function(data, status, headers, config) {
              angular.extend(self.data, data);
              deferred.resolve(data);
            }).error(function(data, status, headers, config) {
              if (status === 300) {
                self.traverse(headers().location).then(function(client) {
                  deferred.resolve(client);
                });
              }
            });
        });
        return deferred.promise;
      }
      return def.promise;
    }
  })
  .factory('base64', function() {
    var Base64 = {
      // private property
      _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      // public method for encoding
      encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);
        while(i < input.length) {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
      },
      // public method for decoding
      decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while(i < input.length) {
          enc1 = this._keyStr.indexOf(input.charAt(i++));
          enc2 = this._keyStr.indexOf(input.charAt(i++));
          enc3 = this._keyStr.indexOf(input.charAt(i++));
          enc4 = this._keyStr.indexOf(input.charAt(i++));
          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;
          output = output + String.fromCharCode(chr1);
          if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
          }
        }
        output = Base64._utf8_decode(output);
        return output;
      },
      // private method for UTF-8 encoding
      _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for(var n = 0; n < string.length; n++) {
          var c = string.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          }
          else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }
        }
        return utftext;
      },
      // private method for UTF-8 decoding
      _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while(i < utftext.length) {
          c = utftext.charCodeAt(i);
          if (c < 128) {
            string += String.fromCharCode(c);
            i++;
          }
          else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
          }
          else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
          }
        }
        return string;
      }
    }
    return Base64;
  });


