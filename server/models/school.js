var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , mediaTypes = [
    '/api/v1/schools/university.json',
    '/api/v1/schools/college.json'
  ];
var SchoolSchema = new mongoose.Schema({
  id: String,
  data: {
    unitId: Number,
    institutionName: String,
    city: String,
    state: String,
    zip: String,
    totalEnrollment: Number,
    applicationFee: Number,
    totalUndergraduateEnrollment: Number,
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
    SAT: Number,
    TOEFLScore: Number,
    IELTSScore: Number,
    GPA: Number,
    financesRequired: Number,
    diplomaRequired: String,
    referencesRequired: String,
    essaysRequired: String
  },
  mediaTypes: [
    { type: String, enum: mediaTypes }
  ],
  cardIds: [
    { type: String }
  ]
});
module.exports = mongoose.model("School", SchoolSchema);