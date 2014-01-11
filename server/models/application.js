var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , _ = require('underscore');
var ApplicationSchema = new mongoose.Schema({
  type: String,
  admissionsId: String,
  schoolIds: [
    { type: String }
  ],
  data: Schema.Types.Mixed,
  mediaType: String,
  schemaCards: [
    {
      group: String,
      mediaType: String
    }
  ]
});
var schoolMap = function(school) {
  return {
    'schoolId': school._id
  }
};
var restMap = function(app) {
  return {
    'applicationId': app._id,
    'student': {
      'studentId': app.studentId
    },
    'schools': _.map(app.schoolIds, schoolMap)
  };
};
ApplicationSchema.static('rest', function(query, callback) {
  var self = this;
  self.find(query, function(err, applications) {
    var apps = _.map(applications, restMap);
    callback(err, apps);
  });
});
module.exports = mongoose.model("Application", ApplicationSchema);
