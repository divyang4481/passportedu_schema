var client = angular.module('client', ['schema'])
  .config(function($interpolateProvider) {
  })
  .controller('ClientArea',function($resource, $scope, jsonSchema, base64) {
    $scope.link = function() {
      $scope.client.traverse(this.rel.rel, {});
    };
    new jsonSchema('http://localhost:8080/api/v1').then(function(client) {
      var passport = client;
      $scope.client = passport;
      $scope.client.forms = {};
      //      passport.traverse('authenticate', {username: 'c', password: 'c'}).then(function(auth) {
      //        var authString = auth.username + ':' + auth.token;
      //        var authToken = base64.encode(authString);
      //        passport.setHeader("Authorization", 'Basic ' + authToken);
      //        $scope.client = passport;
      //        $scope.client.forms = {};
      //        passport.traverse('portal_user').then(function(student) {
      //          student.traverse('applications', student.data[0]).then(function(applications) {
      //            student.traverse('full_0').then(function(application) {
      //              application.traverse('newCard', {
      //                mediaType: '/api/v1/card/form/small',
      //                data: {
      //                  title: 'Contact Info',
      //                  fields: [
      //                    {
      //                      prompt: 'Full Name',
      //                      name: 'fullName',
      //                      type: 'text'
      //                    },
      //                    {
      //                      prompt: 'Email Address',
      //                      name: 'email',
      //                      type: 'text'
      //                    },
      //                    {
      //                      prompt: 'Mobile Number',
      //                      name: 'mobile',
      //                      type: 'text'
      //                    }
      //                  ]
      //                }
      //              }).then(function(response) {
      ////                  application.traverse('cards').then(function(cards) {
      ////                    console.log(cards);
      ////                  });
      //                });
      //            });
      //          });
      //        });
      //      });
    });
  }).run(function() {
  });