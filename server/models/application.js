var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
/**
 *
 */
var ApplicationSchema = new mongoose.Schema({
  type: String,
  fee: Number,
  admissionsId: String,
  schools: [
    {type: String, ref: "School"}
  ],
  data: Schema.Types.Mixed,
  mediaType: String,
  schemaCards: [
    {group: String, mediaType: String}
  ],
  stripe: [
    Schema.Types.Mixed
  ]
});
/**
 *
 */
module.exports = mongoose.model("Application", ApplicationSchema);
