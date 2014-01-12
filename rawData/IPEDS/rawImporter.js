var fs = require('fs')
  , lazy = require('lazy')
  , _ = require('underscore')
  , q = require('q');
var types = {
  unitId: Number,
  institutionName: String,
  totalEnrollment: Number,
  percentInternationalStudents: Number,
  percentFemaleStudent: Number,
  percentAdmitted: Number,
  normalFeesTuition: Number,
  outOfStateTuition: Number,
  outOfStateFees: Number,
  SATCriticalReading25: Number,
  SATCriticalReading75: Number,
  SATMath25: Number,
  SATMath75: Number,
  SATWriting25: Number,
  SATWriting75: Number,
  academicPrograms: String
};
module.exports = function() {
  var deferred = q.defer();
  new lazy(fs.createReadStream(__dirname + '/cds_2011_CSV_712013-196.csv'))
    .lines
    .map(String)
    .skip(1)
    .map(function(line) {
      line = line.replace(/\"/g, '');
      var fields = line.split(',');
      var school = {
        unitId: fields[0],
        institutionName: fields[1],
        totalEnrollment: fields[3],
        totalUndergraduateEnrollment: fields[4],
        percentInternationalStudents: fields[6],
        percentFemaleStudent: fields[7],
        percentAdmitted: fields[14],
        normalFeesTuition: fields[12],
        outOfStateTuition: fields[17],
        outOfStateFees: fields[18],
        SATCriticalReading25: fields[22],
        SATCriticalReading75: fields[23],
        SATMath25: fields[24],
        SATMath75: fields[25],
        SATWriting25: fields[26],
        SATWriting75: fields[27],
        applicationIds: [],
        cardsIds: []
      };
      return school;
    }).join(function(transformedSchools) {
//      console.log(transformedSchools);
//      console.log('resolved');
      deferred.resolve(transformedSchools);
    });
  return deferred.promise;
}