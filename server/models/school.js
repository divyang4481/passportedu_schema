var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , schemas = [
    'psprt.v1.school'
  ];
var SchoolSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  schoolSchema: [
    { type: String, enum: schemas }
  ]
});
module.exports = mongoose.model("School", SchoolSchema);