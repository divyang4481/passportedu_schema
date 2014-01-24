psprtDirectives
  .directive('uploader', function($http, $q, $location) {
    'use strict';
    var rootPath = $location.path().replace(/(students|admissions)\/([0-9a-zA-Z]*).*/, '$1/$2');
    var URL = window.URL || window.webkitURL;
    var link = function(scope, element, attrs) {
      scope.formData = {};
      var fileToDataURL = function(file) {
        var deferred = $q.defer();
        var reader = new FileReader();
        reader.onload = function(e) {
          deferred.resolve(e.target.result);
        };
        reader.readAsDataURL(file);
        return deferred.promise;
      };
      var applyScope = function(imageResult) {
        scope.$apply(function() {
          if (attrs.multiple) {
            scope.image.push(imageResult);
          }
          else {
            scope.image = imageResult;
          }
        });
      };
      element.bind('change', function(evt) {
        //when multiple always return an array of images
        if (attrs.multiple) {
          scope.image = [];
        }
        var files = evt.target.files;
        for(var i = 0; i < files.length; i++) {
          //create a result object for each file in files
          var imageResult = {
            file: files[i],
            url: URL.createObjectURL(files[i])
          };
          fileToDataURL(files[i]).then(function(dataURL) {
            imageResult.dataURL = dataURL;
          });
          if (scope.resizeMaxHeight || scope.resizeMaxWidth) { //resize image
            doResizing(imageResult, function(imageResult) {
              applyScope(imageResult);
            });
          }
          else { //no resizing
            applyScope(imageResult);
          }
        }
        scope.upload();
      });
      scope.upload = function() {
        var imageURI = scope.image.dataURL;
        var fileName = "" + (new Date()).getTime() + ".jpg";
        uploadS3(imageURI, fileName)
          .then(function(greeting) {
            alert('Success: ' + greeting);
          }, function(reason) {
            alert('Failed: ' + reason);
          }, function(update) {
            alert('Got notification: ' + update);
          })
      };
      var signingURI = rootPath + "/aws/signature/";
      var uploadS3 = function(imageURI, fileName) {
        var deferred = $q.defer();
        $http({method: "GET", url: signingURI + fileName})
          .success(function(data) {
            var params = {
              "key": fileName,
              "AWSAccessKeyId": data.awsKey,
              "acl": "public-read",
              "policy": data.policy,
              "signature": data.signature,
              "Content-Type": "image/jpeg"
            };
            angular.extend(data, params);
            function dataURItoBlob(dataURI) {
              var binary = atob(dataURI.split(',')[1]);
              var array = [];
              for(var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
              }
              return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
            }
            var blob = dataURItoBlob(imageURI);
            var fd = new FormData(document.forms[0]);
            fd.append("canvasImage", blob);
            $http({
              method: 'POST',
              url: "https://" + data.bucket + ".s3.amazonaws.com/",
              data: data,
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(data) {
                deferred.resolve(data);
              }).error(function(data, status, headers, config) {
                deferred.reject(data);
              });
          })
          .error(function(data, status, headers, config) {
            deferred.reject(data);
          });
        return deferred.promise;
      };
    };
    return {
      restrict: 'AE',
      replace: true,
      transclude: true,
      scope: {
        fileURL: '='
      },
      link: link,
      template: '<form name="imageUpload">' +
        '<input name="file" type="file" class="form-control">' +
        '</form>'
    }
  });
