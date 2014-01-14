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
      angular.element('.modal').modal('hide');
      $('.modal-backdrop').remove();

      $scope.client.traverse(this.link._link.rel, this.link);
    };
    /**
     * Perform the link action on the Draggable
     * @param drag
     */
    $scope.performDragLinkAction = function(drag) {
      $scope.client.traverse(drag._link.rel, drag);
    };
    /**
     * Perform the link action on the Drop Area
     * @param drag
     * @param drop
     */
    $scope.performDropLinkAction = function(drag, drop) {
      $scope.client.traverse(drop._link.rel, drop);
    };
    $scope.enterDrop = function() {
      $scope.dropping = 1;
    };
    $scope.leaveDrop = function() {
      $scope.dropping = 0;
    };
    var startURL = $location.path();
    startURL = startURL ? startURL : '/api/v1';
    new jsonSchema(startURL).then(function(client) {
      var passport = client;
      $scope.client = passport;
    });
  })
  .controller('CardSelection', function($scope) {
    $scope.performLinkAction = function(card) {
      $scope.client.traverse(card._link.rel, card);
    };
  })
  .directive('autoSaveCard', function(debounce) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        var saveIt = debounce(function() {
          var link = ngModel.$viewValue;
          scope.client.link(link._link.rel, link);
        }, 100);
        element.bind('keypress', function(e) {
          saveIt();
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
      var cards = $filter('semantics')($scope.client.links, {importance: "cards"});
      $scope.client.traverse(this.link._link.rel,
        {
          student: $scope.student,
          cards: cards
        });
    };
  })
  .run(function() {
  });