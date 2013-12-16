var vows = require('vows')
  , assert = require('assert')
  , http = require('http')
  , path = require('path')
  , host = 'localhost'
  , root = '/api/v1'
  , q = require('q')
module.exports = function(method, uri, params) {
  var deferred = q.defer()
    , options = {
      host: host,
      port: 8080,
      path: path.join(root, uri),
      method: method
    }
    , req = http.request(options, function(res) {
      res.setEncoding('utf8')
      res.on('data', function(chunk) {
        deferred.resolve(chunk)
      })
    })
  req.on('error', function(e) {
    deferred.reject(new Error(e))
  })
  req.write(JSON.stringify(params))
  req.end()
  return deferred.promise
}
