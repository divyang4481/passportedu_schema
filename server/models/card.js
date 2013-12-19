var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , mediaTypes = [
    "/api/v1/card/map/small.json",
    "/api/v1/card/media/medium.json",
    "/api/v1/card/media/small.json",
    "/api/v1/card/media/media.json",
    "/api/v1/card/form/small.json",
    "/api/v1/card/form/medium.json",
    "/api/v1/card/form/large.json",
    "/api/v1/card/range/small.json",
    "/api/v1/card/dial/small.json",
    "/api/v1/card/image/small.json",
    "/api/v1/card/image/medium.json",
    "/api/v1/card/video/medium.json",
    "/api/v1/card/qrcode/medium.json",
    "/api/v1/card/weather/medium.json"
  ];
var CardSchema = new mongoose.Schema({
  owners: [
    { type: Schema.Types.Mixed }
  ],
  data: Schema.Types.Mixed,
  mediaType: [
    { type: String, enum: mediaTypes }
  ],
  updated: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Card', CardSchema);
