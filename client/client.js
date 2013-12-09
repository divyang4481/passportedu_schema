var client = angular.module('client', ['schema'])
  .config(function() {})
  .controller('ClientArea', function($resource, $scope, jsonSchema, base64) {
    new jsonSchema('/api/v1').then(function(schema) {
      var passport = schema;
      passport.options('authenticate').then(function(schema) {
        console.log(schema);
      });
      passport.link('authenticate', {username: 'a', password: 'a'}).then(function(auth) {
        var authString = auth.username + ':' + auth.token;
        var authToken = base64.encode(authString);
        passport.link('student', {}, {Token: authToken}).then(function(response) {
          console.log(response);
        });
      });
    });
  })
  .run(function() {});