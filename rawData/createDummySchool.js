var SchoolModel = require('../server/models/school')
  , mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/psprt')
var newSchool = new SchoolModel({
  mediaTypes: [
    '/api/v1/schools/university.json'
  ],
  data: {
    institutionName: 'Start Your Application'
  },
  cardIds: []
});
newSchool.save(function(err) {
  console.log(err, newSchool);
});
console.log(newSchool);