var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , schemas = [
    'psprt.v1.map.small',
    'psprt.v1.map.medium',
    'psprt.v1.media.small',
    'psprt.v1.media.media',
    'psprt.v1.form.small',
    'psprt.v1.form.medium',
    'psprt.v1.form.large',
    'psprt.v1.range.small',
    'psprt.v1.dial.small',
    'psprt.v1.image.small',
    'psprt.v1.image.medium',
    'psprt.v1.video.medium',
    'psprt.v1.qrcode.medium',
    'psprt.v1.weather.medium'
  ]
var CardSchema = new mongoose.Schema({
  data: Schema.Types.Mixed,
  schema: [
    { type: String, enum: schemas }
  ],
  updated: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Card', CardSchema);
