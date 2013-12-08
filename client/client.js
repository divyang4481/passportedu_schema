var client = angular.module('client', ['schemaCrawler'])
  .config(function() {
  })
  .controller('ClientArea', function($resource, $scope, jsonSchema) {
    jsonSchema('/api/v1').then(function(schema) {
      var passport = schema;
      passport.links.cards.get(function(response) {
        console.log(response);
      });
    });
  })
  .run(function() {

  });