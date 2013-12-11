var client = angular.module('client', ['schema'])
  .config(function() {
  })
  .controller('ClientArea',function($resource, $scope, jsonSchema, base64) {
    $scope.link = function() {
      $scope.client.traverse(this.rel.rel);
    };
    new jsonSchema('http://localhost:8080/api/v1').then(function(client) {
      var passport = client;
      passport.link('authenticate', {username: 'a', password: 'a'}).then(function(auth) {
        var authString = auth.username + ':' + auth.token;
        var authToken = base64.encode(authString);
        passport.setHeader("Authorization", 'Basic ' + authToken);
        //        $scope.client = passport;
        passport.traverse('students').then(function(student) {
          student.link('applications', student.data[0]).then(function(applications) {
            var firstApp = applications.applications[0];
            if (firstApp) {
              student.traverse('applications', firstApp).then(function(application) {
                application.link('newCard', {
                  mediaType: '/api/v1/card/form/small',
                  data: {
                    title: 'Contact Info',
                    fields: [
                      {
                        prompt: 'Full Name',
                        name: 'fullName',
                        type: 'text'
                      },
                      {
                        prompt: 'Email Address',
                        name: 'email',
                        type: 'text'
                      },
                      {
                        prompt: 'Mobile Number',
                        name: 'mobile',
                        type: 'text'
                      }
                    ]
                  }
                }).then(function(response) {
                    application.link('cards').then(function(cards) {
                      console.log(cards);
                    });
                  });
              });
            } else {
              student.link('createApplication', student.data[0]).then(function(application) {
                console.log(application);
              });
            }
          });
        });
      });
    });
  }).run(function() {
  });