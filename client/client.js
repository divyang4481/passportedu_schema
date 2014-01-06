var client = angular.module('client', ['schema', 'clientUtilities', 'MagicLink', 'dragAndDrop'])
  .config(function($interpolateProvider) {
  })
  .filter('fieldName', function() {
    return function(input) {
      return input.replace(/[^a-zA-Z0-9]/g, '_');
    };
  })
  .controller('ClientArea',function($resource, $location, $filter, $scope, jsonSchema, base64) {
    $scope.client = {};
    $scope.traverse = function() {
      angular.element('.modal').modal('hide');
      $('.modal-backdrop').remove();
      $scope.client.traverse(this.link.rel, {});
    };
    $scope.getTemplate = function() {
      return '/templates/' + $scope.client.url;
    };
    var startURL = $location.path();
    startURL = startURL ? startURL : '/api/v1';
    new jsonSchema(startURL).then(function(client) {
      var passport = client;
      $scope.client = passport;
      $scope.client.forms = {};
    });
  })
  .controller('CardSelection', function($scope) {
    $scope.cards = [];
    $scope.addCardToApplication = function(card, element){
      $scope.client.traverse(card.rel, {type: card.rel});
    };
  })
  .run(function() {
  });