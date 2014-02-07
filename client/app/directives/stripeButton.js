psprtDirectives
  .directive('stripeButton', function($resource) {
    var link = function(scope, element, attrs) {
      var handler = StripeCheckout.configure({
        key: scope.link._link.key,
        image: '/assets/images/passportEDU_nb.png',
        token: function(token, args) {
          console.log(token);
//          scope.action({token: token});
          // Use the token to create the charge with a server-side script.
        }
      });

      element.on('click', function(e) {
        // Open Checkout with further options
        handler.open({
          name: scope.link._link.name,
          description: scope.link._link.description,
          amount: scope.link._link.amount
        });
        e.preventDefault();
      });
    };
    return {
      restrict: 'AE',
      replace: true,
      transclude: true,
      scope: {
        link: '=',
        image: '=',
        action: '='
      },
      link: link,
      template: '<button class="btn btn-primary">Pay with Stripe</button>'
    }
  });
