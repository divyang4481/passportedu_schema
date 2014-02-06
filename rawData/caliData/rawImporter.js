var SchoolModel = require('../../server/models/school')
  , fs = require('fs')
  , lazy = require('lazy')
  , _ = require('underscore')
  , mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/psprt');
var stream = fs.createReadStream(__dirname + '/CaliDataTabs.txt');
require('fs').readFileSync(__dirname + '/CaliDataTabs.txt')
  .toString()
  .split(/\r/)
  .forEach(
  function(line) {
    line = line.replace(/\"/g, '');
    var fields = line.split("\t");
    if (!(Number(fields[0]) > 0) || fields[2] !== 'California') {
      return;
    }
    var school = {
      unitId: fields[0],
      state: fields[2],
      schoolURL: fields[5],
      applicationFee: Number(fields[9].replace(/[^0-9]/g, ''))
    };
    var financesReq = Number(fields[11].replace(/[^0-9]/g, ''));
    if (_.isNumber(financesReq)) {
      school.financesRequired = financesReq;
    }
    var GPA = fields[10];
    if (!_.isEmpty(GPA)) {
      school.GPA = Number(GPA) > 0 ? Number(fields[10]) : 0;
    }
    var TOEFL = fields[8];
    if (!_.isEmpty(TOEFL)) {
      school.TOEFLScore = Number(TOEFL) > 0 ? Number(TOEFL) : 0;
    }
    var IELTS = fields[16];
    if (!_.isEmpty(IELTS)) {
      school.IELTSScore = Number(IELTS) > 0 ? Number(IELTS) : 0;
    }
    var SAT = fields[12];
    if (!_.isEmpty(SAT)) {
      school.SAT = Number(SAT) > 0 ? Number(SAT) : 0;
    }
    var Deadline = fields[19];
    if (!_.isEmpty(Deadline)) {
      school.deadline = Deadline;
    }
    var Essays = fields[18];
    if (Essays == 'Y') {
      school.essaysRequired = 'Y';
    }
    if (Essays == 'NR') {
      school.essaysRequired = 'N';
    }
    var References = fields[15];
    if (References == 'Y') {
      school.referencesRequired = 'Y';
    }
    if (References == 'NR') {
      school.referencesRequired = 'N';
    }
    var Diploma = fields[13];
    if (Diploma == 'Y') {
      school.diplomaRequired = 'Y';
    }
    if (Diploma == 'NR') {
      school.diplomaRequired = 'N';
    }
    SchoolModel.findOne({"data.unitId": Number(school.unitId)},
      function(err, School) {
        if (!School) {
          return;
        }
        var tags = [];
        School.data.schoolURL = school.schoolURL;
        School.data.applicationFee = school.applicationFee;
        if (school.applicationFee === 0) {
          School.data.tags.push('noApplicationFee');
        }
        School.data.financesRequired = school.financesRequired;
        School.data.state = school.state;
        if (school.GPA) {
          School.data.GPA = school.GPA;
        }
        if (school.TOEFLScore) {
          School.data.TOEFLScore = school.TOEFLScore;
        }
        if (school.IELTSScore) {
          School.data.IELTSScore = school.IELTSScore;
        }
        if (school.SAT) {
          School.data.SAT = school.SAT;
        }
        if (school.deadline) {
          School.data.deadlines.push(new Date(school.deadlines));
        }
        if (school.essaysRequired) {
          School.data.essaysRequired = school.essaysRequired;
        }
        if (school.essaysRequired === 'N') {
          School.data.tags.push('noEssays');
        }
        if (school.referencesRequired) {
          School.data.referencesRequired = school.referencesRequired;
        }
        if (school.referencesRequired === 'N') {
          School.data.tags.push('noReferences');
        }
        if (school.diplomaRequired) {
          School.data.diplomaRequired = school.diplomaRequired;
        }
        if (school.diplomaRequired === 'N') {
          School.data.tags.push('noDiploma');
        }
        console.log(School);
        School.save(function(err, savedSchool) {
          console.log(err, savedSchool);
        });
      });
  });