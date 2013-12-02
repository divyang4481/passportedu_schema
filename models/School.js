var mongoose = require('mongoose');
var SchoolSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String
});
module.exports = mongoose.model("School", SchoolSchema);