var AWS = require('aws-sdk')
  , fs = require('fs')
  , Q = require('q')
  , path = require('path')
  , io = require('../index.js').io;
/**
 * Configure AWS S3
 */
AWS.config.loadFromPath(__dirname + '/aws.config.json');
var uploadImage = uploadImage = function(file, userId) {
  var deferredMain = Q.defer()
    , fileInfo = file.match(/^data:image\/(\w+);base64,/, "")
    , buf = new Buffer(file.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  var fileType = fileInfo[1];
  postToS3 = function(file, userId) {
    var s3FilePath = path.join('users', '' + userId, '' + Math.ceil((Date.now() / 1000)) + '.' + fileType);
    var s3bucket = new AWS.S3({params: {Bucket: 'psprt'}}),
      deferred = Q.defer(),
      dataToPost = {
        Bucket: 'psprt',
        Key: s3FilePath,
        ACL: 'public-read',
        ContentType: fileType
      };
    /**
     *
     */
      //    fs.readFile(file.path, function(err, readFile) {
    dataToPost.Body = buf;
    var req = s3bucket.putObject(dataToPost);
    req.on('httpUploadProgress', updateProgress);
    req.send(function(err, data) {
      if (err) {
        deferred.reject(err.message);
      } else {
        deferred.resolve(s3FilePath);
      }
    });
    //    });
    return deferred.promise;
  };
  /**
   *
   */
  postToS3(file, userId).then(function(s3FilePath) {
    deferredMain.resolve('https://s3-us-west-2.amazonaws.com/psprt/' + s3FilePath);
  }, function(err) {
    deferredMain.reject(err)
  });
  return deferredMain.promise;
};
/**
 * Fallback when sockets not supported
 */
var updateProgress = function() {
};
/**
 * Using Socket IO to communicate file upload progress
 */
io.sockets.on('connection', function(socket) {
  updateProgress = function(progress) {
    socket.emit('progress:change', progress); // Send progress to client
  }
  socket.on('progress:change', function(data) {
    console.log(data);
  });
});
/**
 * Upload file to S3
 */
module.exports = {
  uploadImage: uploadImage
};