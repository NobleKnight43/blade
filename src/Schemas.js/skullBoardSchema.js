const { model, Schema } = require('mongoose');

const skullboardSchema = new Schema({
  Guild: String,
  Channel: String,
  Threshold: Number,
});

module.exports = model('skullboard', skullboardSchema);
