var client = angular.module('client', ['schema', 'MagicLink', 'dragAndDrop', 'imageUpload'])
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
      $scope.client.traverse(drag._link.rel, {drag: drag, drop: drop});
    };
    $scope.enterDrop = function(drag, drop, el) {
      drop._dropOver = true;
    };
    $scope.leaveDrop = function(drag, drop) {
      drop._dropOver = false;
    };
    var startURL = $location.path();
    startURL = startURL ? startURL : '/api/v1';
    new jsonSchema(startURL).then(function(client) {
      var passport = client;
      $scope.client = passport;
    });
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
        element.bind('keyup change image', function(e) {
          saveIt();
        });
      }
    };
  })
  .run(function() {
  });