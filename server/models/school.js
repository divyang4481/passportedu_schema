var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , mediaTypes = [
    '/api/v1/schools/university.json',
    '/api/v1/schools/college.json'
  ];
var SchoolSchema = new mongoose.Schema({
  id: String,
  data: Schema.Types.Mixed,
  mediaTypes: [
    { type: String, enum: mediaTypes }
  ],
  cardIds: [
    { type: String }
  ]
});
module.exports = mongoose.model("School", SchoolSchema);