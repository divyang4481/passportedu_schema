var SchoolModel = require('../../../server/models/school')
  , CardModel = require('../../../server/models/schoolCard')
  , mongoose = require('mongoose')
  , rawImporter = require('../rawImporter')
  , _ = require('underscore');
mongoose.connect('mongodb://localhost/psprt');
rawImporter().then(function(schools) {
  _.each(schools, function(school) {
    console.log(school.institutionName);
    var newSchool = new SchoolModel({
      mediaTypes: [
        '/api/v1/schools/university.json'
      ],
      data: school,
      cardIds: []
    });
    if (school.SATMath75) {
      var satScores = {
        data: {
          title: 'SAT Math Score Range',
          seventyFifth: school.SATMath75,
          twentyFifth: school.SATMath25
        },
        type: [
          "schools/sat/range"
        ],
        owners: [
          {schools: newSchool._id}
        ]
      }
      var satScores = new CardModel(satScores);
      satScores.save(function(err) {
        newSchool.cards.push(satScores._id);
        newSchool.save(function(err) {
          console.log(newSchool);
        });
      });
    } else {
      newSchool.save(function(err) {
        console.log(newSchool);
      });
    }
  });
});
