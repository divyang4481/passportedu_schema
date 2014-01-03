var client = angular.module('client', ['schema', 'clientUtilities', 'MagicLink'])
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
    $scope.adminLinks = function() {
      return $filter('adminLinks')($scope.client.links);
    };
    $scope.modalForm = function() {
      $scope.modal = $(event.target).next().modal('show');
    };
    $scope.pushEmptyArray = function() {
      if (angular.isArray(this.property.value)) {
        this.property.value.push('');
      } else {
        this.property.value = [];
      }
    };
    $scope.notGET = function(link) {
      return link.method !== 'GET';
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
  .filter('adminLinks', function() {
    return function(links) {
      var adminLinks = [];
      angular.forEach(links, function(link) {
        if(link.importance === "administrative") {
          adminLinks.push(link);
        }
      });
      return adminLinks;
    };
  })
  .run(function() {
  });