var mongoose = require ('mongoose')
, Schema = mongoose.Schema
var ApplicationSchema = new mongoose.Schema ({
  studentId: String,
  cardIds: [
    { type: String }
  ],
  schoolIds: [
    { type: String }
  ]
});
module.exports = mongoose.model ("Application", ApplicationSchema);
