var vows = require('vows')
  , assert = require('assert')
  , http = require('http')
  , host = 'http://localhost:8080'
  , path = require('path')
  , apiRequest = require('./apirequest')
  , root = path.join(host, '/api/v1')
vows.describe('Passport API').addBatch({
  'A client': {
    topic: function() {
      return apiRequest('OPTIONS', '/', {})
    },
    'should be valid JSON': function(topic) {
      topic.then(function(response) {
        var get = JSON.parse(response)
        assert.equal(get, {})
      })
    }
  }
}).run()

//apievangelist.com
//kin lane