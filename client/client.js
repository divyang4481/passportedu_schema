var client = angular.module('client', ['schema', 'MagicLink', 'dragAndDrop', 'imageUpload'])
  .filter('fieldName', function() {
    return function(input) {
      return input.replace(/[^a-zA-Z0-9]/g, '_');
    };
  })
  .controller('ClientArea', function($rootScope, $resource, $location, $filter, $scope, jsonSchema) {
    $scope.client = {};
    $scope.traverse = function() {
      $scope.client.traverse(this.link._link.rel, this.link).then(function(client) {
        if (angular.isDefined(client.responseHeaders) && angular.isDefined(client.responseHeaders['x-intercom-email'])) {
          var update = {
            email: client.responseHeaders['x-intercom-email'],
            name: client.responseHeaders['x-intercom-full-name'],
            user_id: client.responseHeaders['x-intercom-user-id'],
            created_at: client.responseHeaders['x-intercom-created-at'],
            user_hash: client.responseHeaders['x-intercom-user-hash'],
            app_id: client.responseHeaders['x-intercom-api'],
            "increments": {
              "time": 1
            }
          };
          angular.extend(update, JSON.parse(client.responseHeaders['x-intercom-custom']));
          window.Intercom('update', update);
        }
      });
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
    /**
     * When hovering over drop with draggable
     * @param drag
     * @param drop
     * @param el
     */
    $scope.enterDrop = function(drag, drop, el) {
      drop._dropOver = true;
    };
    /**
     * When leaving hover over drop with draggable
     * @param drag
     * @param drop
     */
    $scope.leaveDrop = function(drag, drop) {
      drop._dropOver = false;
    };
    /**
     * Get the Schema Client
     */
    var startURL = $location.path();
    startURL = startURL ? startURL : '/api/v1';
    new jsonSchema(startURL).then(function(client) {
      var passport = client;
      $scope.client = passport;
      var client = $scope.client;
      if (angular.isDefined(client.responseHeaders) && angular.isDefined(client.responseHeaders['x-intercom-email'])) {
        var boot = {
          email: client.responseHeaders['x-intercom-email'],
          name: client.responseHeaders['x-intercom-full-name'],
          user_id: client.responseHeaders['x-intercom-user-id'],
          created_at: client.responseHeaders['x-intercom-created-at'],
          user_hash: client.responseHeaders['x-intercom-user-hash'],
          app_id: client.responseHeaders['x-intercom-api']
        };
        angular.extend(boot, JSON.parse(client.responseHeaders['x-intercom-custom']));
        window.Intercom('boot', boot);
      }
    });
  })
  .directive('autoSaveCard', function(debounce) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        var saveIt = debounce(function() {
          var link = ngModel.$viewValue;
          scope.client.traverse(link._link.rel, link);
        }, 100);
        element.bind('keyup change image', function(e) {
          saveIt();
        });
      }
    };
  })
  .run(function() {
    setInterval(function() {
      var client = $scope.client;
      if (angular.isDefined(client.responseHeaders) && angular.isDefined(client.responseHeaders['x-intercom-email'])) {
        var update = {
          email: client.responseHeaders['x-intercom-email'],
          name: client.responseHeaders['x-intercom-full-name'],
          user_id: client.responseHeaders['x-intercom-user-id'],
          created_at: client.responseHeaders['x-intercom-created-at'],
          user_hash: client.responseHeaders['x-intercom-user-hash'],
          app_id: client.responseHeaders['x-intercom-api'],
          "increments": {
            "time": 1
          }
        };
        angular.extend(update, JSON.parse(client.responseHeaders['x-intercom-custom']));
        window.Intercom('update', update);
      }
    }, 5000);
  });