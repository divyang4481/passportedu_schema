var mongoose = require ('mongoose')
, Schema = mongoose.Schema
var ApplicationSchema = new mongoose.Schema ({
  unitId: Number
});
module.exports = mongoose.model ("Application", ApplicationSchema);
