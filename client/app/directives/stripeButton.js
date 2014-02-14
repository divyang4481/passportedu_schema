psprtDirectives
  .directive('stripeButton', function() {
    var linkFunc = function(scope, element, attrs) {
      scope.token = false;
      scope.buttonAction = 'Pay Application Fee';
      var handler = StripeCheckout.configure({
        key: scope.link.stripe_publishable_key,
        image: '/assets/images/passportEDU_nb.png',
        token: function(token, args) {
          scope.buttonAction = 'Confirm Payment';
          scope.token = true;
          scope.link.token = token;
          scope.$apply();
        }
      });
      element.on('click', function(e) {
        if (scope.token) {
          scope.action(scope.link);
        } else {
          handler.open({
            name: scope.link._link.name,
            description: scope.link._link.description,
            amount: 1000
          });
          e.preventDefault();
        }
      });
    };
    return {
      restrict: 'AE',
      replace: true,
      transclude: true,
      scope: {
        link: '=',
        image: '=',
        amount: '=',
        action: '=',
        key: '='
      },
      link: linkFunc,
      template: '<button class="btn" ng-class="{\'btn-primary\': !token, \'btn-success\': token}">' +
        '<span ng-bind="buttonAction"></span> <span ng-show="token" ng-bind="amount / 100 | currency"</button>'
    }
  });
