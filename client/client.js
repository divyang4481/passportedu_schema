var client = angular.module('client', ['schema', 'clientUtilities'])
  .config(function($interpolateProvider) {
  })
  .filter('fieldName', function() {
    return function(input) {
      return input.replace(/[^a-zA-Z]/g, '_');
    };
  })
  .controller('ClientArea',function($resource, $scope, jsonSchema, base64) {
    $scope.link = function() {
      $scope.client.traverse(this.rel.rel, {});
    };
    $scope.modalForm = function() {
      $(event.target).next().modal('show');
    };
    new jsonSchema('/api/v1/').then(function(client) {
      var passport = client;
      $scope.client = passport;
      $scope.client.forms = {};
    });
  }).run(function() {
  });