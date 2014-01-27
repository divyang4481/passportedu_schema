var SchoolModel = require('../../../server/models/school')
  , card = require('../../../server/models/schoolCard')
  , fs = require('fs')
  , _ = require('underscore')
  , mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/psprt');
var stream = fs.createReadStream(__dirname + '/../CaliDataTabs.txt');
require('fs').readFileSync(__dirname + '/../CaliDataTabs.txt')
  .toString()
  .split(/\r/)
  .forEach(
  function(line) {
    line = line.replace(/\"/g, '');
    var fields = line.split("\t");
    if (!(Number(fields[0]) > 0) || fields[2] !== 'California') {
      return;
    }
    var schoolCards = {};
    var school = {
      unitId: fields[0],
      state: fields[2],
      schoolURL: fields[5],
      applicationFee: Number(fields[9].replace(/[^0-9]/g, ''))
    };
    var financesReq = Number(fields[11].replace(/[^0-9]/g, ''));
    if (_.isNumber(financesReq) && financesReq > 0) {
      schoolCards['schools/finances'] = {
        finances: financesReq
      };
    }
    var GPA = fields[10];
    if (!_.isEmpty(GPA) && GPA > 0) {
      schoolCards['schools/gpa'] = {
        gpa: Number(GPA) > 0 ? Number(GPA) : 0
      };
    }
    var TOEFL = fields[8];
    if (!_.isEmpty(TOEFL) && TOEFL > 0) {
      schoolCards['schools/toefl'] = {
        toefl: Number(TOEFL) > 0 ? Number(TOEFL) : 0
      };
    }
    var IELTS = fields[16];
    if (!_.isEmpty(IELTS) && IELTS > 0) {
      schoolCards['schools/ielts'] = {
        ielts: Number(IELTS) > 0 ? Number(IELTS) : 0
      };
    }
    var SAT = fields[12];
    if (!_.isEmpty(SAT) && SAT > 0) {
      schoolCards['schools/sat'] = {
        sat: Number(SAT) > 0 ? Number(SAT) : 0
      };
    }
    var Deadline = fields[19];
    if (!_.isEmpty(Deadline)) {
      schoolCards['schools/deadline'] = {
        deadline: Deadline
      };
    }
    var Essays = fields[18];
    if (Essays == 'Y') {
      schoolCards['schools/essays'] = {
        essays: 'Y'
      };
    }
    if (Essays == 'NR') {
      schoolCards['schools/essays'] = {
        essays: 'N'
      };
    }
    var References = fields[15];
    if (References == 'Y') {
      schoolCards['schools/references'] = {
        references: 'Y'
      };
    }
    if (References == 'NR') {
      schoolCards['schools/references'] = {
        references: 'N'
      };
    }
    var Diploma = fields[13];
    if (Diploma == 'Y') {
      schoolCards['schools/diploma'] = {
        diploma: 'Y'
      };
    }
    if (Diploma == 'NR') {
      schoolCards['schools/diploma'] = {
        diploma: 'N'
      };
    }
    var createAddCard = function(data, type, School) {
      card.create({
        type: type,
        data: data,
        owners: {
          schools: [School._id.toString()]
        }
      }, function(err, Card) {
        console.log(err);
        School.cards.push(Card._id.toString());
        School.save(function(err) {
          console.log(err, type, data, School);
        });
      });
    };
    SchoolModel.findOne({"data.unitId": Number(school.unitId)},
      function(err, School) {
        _.each(schoolCards, function(data, type) {
          createAddCard(data, type, School);
        });
      });
  });
