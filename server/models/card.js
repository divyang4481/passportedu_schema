var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , cardTypes = [
    "application/attendance/term",
    "application/documents/transcript",
    "application/documents/passport",
    "application/documents/government",
    "application/contact/basic",
    "application/contact/guardian",
    "application/contact/address/home",
    "application/contact/address/mailing",
    "application/nationality",
    "application/demographic",
    "application/language",
    "application/academic/exams/sat",
    "application/academic/exams/gre",
    "application/academic/exams/gmat",
    "application/academic/schools/previous"
  ];
var CardSchema = new mongoose.Schema({
  owners: Schema.Types.Mixed,
  data: Schema.Types.Mixed,
  type: {
    type: String, enum: cardTypes
  },
  order: Number,
  updated: {
    type: Date, default: Date.now
  }
});
module.exports = mongoose.model('Card', CardSchema);
