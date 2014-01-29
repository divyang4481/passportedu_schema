var client = angular.module('client', ['schema', 'MagicLink', 'dragAndDrop', 'psprtDirectives'])
  .filter('fieldName', function() {
    return function(input) {
      return input.replace(/[^a-zA-Z0-9]/g, '_');
    };
  })
  .controller('ClientArea', function($rootScope, $resource, $location, $filter, $scope, jsonSchema) {
    $rootScope.client = {};
    $scope.$watch('client.url', function() {
      angular.element('.modal-backdrop').remove();
    });
    /**
     * Traverse a link to a new URL, given the rel and the link params/data
     */
    $scope.traverse = function() {
      $rootScope.client.traverse(this.link._link.rel, this.link)
        .then(function(client) {
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
      $rootScope.client.traverse(drag._link.rel, {drag: drag, drop: drop});
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
      $rootScope.client = passport;
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
  .controller('AnonApplication', function($rootScope, $scope, $filter, base64) {
    $scope.cards = [];
    $scope.student = {};
    $scope.submitRegisterApp = function() {
      var cards = $filter('semantics')($rootScope.client.links, {importance: "cards"});
      $scope.client.setHeader('Authorization', base64.encode($scope.student.username + ':' + $scope.student.password));
      $scope.$watch('client.url', function() {
        angular.element('.modal-backdrop').remove();
      });
      $scope.client.setHeader('Token', null);
      $scope.client.traverse('register', {
        student: $scope.student,
        cards: cards
      }).then(function() {
          angular.element('.modal-backdrop').remove();
        });
    };
  })
  .factory('socket', function($rootScope) {
    var socket = io.connect();
    return {
      on: function(eventName, callback) {
        socket.on(eventName, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        });
      },
      emit: function(eventName, data, callback) {
        socket.emit(eventName, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  })
  .directive("fileread", ['socket', function(socket) {
    return {
      scope: {
        fileread: "=",
        progress: '='
      },
      link: function(scope, element, attributes) {
        socket.on('progress:change', function(data) {
          scope.progress = Math.ceil(100 * data.loaded / data.total);
        });
        element.bind("change", function(changeEvent) {
          var reader = new FileReader();
          reader.onload = function(loadEvent) {
            scope.$apply(function() {
              scope.fileread = loadEvent.target.result;
            });
          }
          reader.readAsDataURL(changeEvent.target.files[0]);
        });
      }
    }
  }])
  .run(function($rootScope) {
    setInterval(function() {
      var client = $rootScope.client;
      if (angular.isDefined(window.Intercom)
        && angular.isDefined(client)
        && angular.isDefined(client.responseHeaders)
        && angular.isDefined(client.responseHeaders['x-intercom-email'])) {
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
        if (angular.isDefined(window.Intercom.isInitialized)) {
          window.Intercom('update', update);
        } else {
          window.Intercom('boot', update);
        }
      }
    }, 5000);
  });