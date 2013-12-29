var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , mediaTypes = [
    "map/small",
    "media/medium",
    "media/small",
    "media/media",
    "form/small",
    "form/medium",
    "form/large",
    "range/small",
    "dial/small",
    "image/small",
    "image/medium",
    "video/medium",
    "qrcode/medium",
    "weather/medium"
  ];
var CardSchema = new mongoose.Schema({
  owners: [
    { type: Schema.Types.Mixed }
  ],
  data: Schema.Types.Mixed,
  mediaType: { type: String, enum: mediaTypes },
  updated: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Card', CardSchema);
