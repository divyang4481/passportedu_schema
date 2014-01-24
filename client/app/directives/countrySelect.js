psprtDirectives
  .factory('Countries', function($resource) {
    return $resource('/flatFiles/countries.json', {}, {
      query: {
        cache: true,
        method: 'GET',
        isArray: true
      }});
  })
  .directive('countrySelect', function($resource, Countries) {
    var link = function(scope, element, attrs) {
      Countries.query(function(results) {
        scope.countries = results;
      });
    };
    return {
      restrict: 'AE',
      replace: true,
      transclude: true,
      require: 'ngModel',
      scope: {
        value: '='
      },
      link: link,
      template: '<select ng-model="value" ng-options="country.code as country.name for country in countries">'
    }
  });
