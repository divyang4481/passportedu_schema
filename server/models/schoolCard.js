var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
/**
 *
 * @type {mongoose.Schema}
 */
var CardSchema = new mongoose.Schema({
  owners: Schema.Types.Mixed,
  data: Schema.Types.Mixed,
  type: String,
  order: Number,
  updated: {
    type: Date, default: Date.now
  }
});
module.exports = mongoose.model('SchoolCard', CardSchema);
