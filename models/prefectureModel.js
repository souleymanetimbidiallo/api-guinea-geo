const mongoose = require('mongoose');
const metadata = require('./administrativeMetadata');
const Schema = mongoose.Schema;

const prefectureSchema = new Schema({
  ...metadata,
  name: { type: String, required: true },
  population: Number,
  area: Number,
  region: { type: Schema.Types.ObjectId, ref: 'Region' } // Référence à la région
});

module.exports = mongoose.model('Prefecture', prefectureSchema);
