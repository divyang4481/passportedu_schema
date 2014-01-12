var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , mediaTypes = [
    "university",
    "college"
  ];
var SchoolSchema = new mongoose.Schema({
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
    essaysRequired: String,
    tags: [
      { type: String }
    ],
    deadlines: [
      { type: Date }
    ],
    requiredHealthTests: [
      { type: String }
    ],
    categories: [
      { type: String }
    ]
  },
  applications: [
    {type: String, ref: "Application"}
  ],
  mediaTypes: { type: String },
  cards: [
    {type: String, ref: "Card"}
  ]
});
module.exports = mongoose.model("School", SchoolSchema);