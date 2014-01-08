var client = angular.module('client', ['schema', 'clientUtilities', 'MagicLink', 'dragAndDrop'])
  .config(function($interpolateProvider) {
  })
  .filter('fieldName', function() {
    return function(input) {
      return input.replace(/[^a-zA-Z0-9]/g, '_');
    };
  })
  .controller('ClientArea', function($rootScope, $resource, $location, $filter, $scope, jsonSchema) {
    $scope.client = {};
    $scope.traverse = function() {
      //      angular.element('.modal').modal('hide');
      //      $('.modal-backdrop').remove();
      $scope.client.traverse(this.link.rel, {});
    };
    var startURL = $location.path();
    startURL = startURL ? startURL : '/api/v1';
    new jsonSchema(startURL).then(function(client) {
      var passport = client;
      $scope.client = passport;
    });
  })
  .controller('CardSelection', function($scope) {
    $scope.cards = [];
    $scope.performLinkAction = function(card, element) {
      $scope.client.traverse(card.rel, {type: card.rel});
    };
  })
  .directive('autoSaveCard', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        element.bind('keypress', function(e) {
          var link = ngModel.$viewValue;
          scope.client.link(link.rel, link);
        });
      }
    };
  })
  .controller('AnonApplication', function($scope, $filter) {
    $scope.cards = [];
    $scope.student = {};
    $scope.$watch('client.links', function() {
      angular.forEach($scope.client.links, function(link) {
        if (link.importance == 'cards') {
          $scope.cards.push(link);
        }
      });
    });
    $scope.submitRegisterApp = function() {
      $scope.client.traverse(this.link.rel,
        {
          student: $scope.student,
          cards: $scope.cards
        });
    };
  })
  .run(function() {
  });