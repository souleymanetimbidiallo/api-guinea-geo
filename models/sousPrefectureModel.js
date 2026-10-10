const mongoose = require('mongoose');
const metadata = require('./administrativeMetadata');
const Schema = mongoose.Schema;

const sousPrefectureSchema = new Schema({
  ...metadata,
  name: { type: String, required: true },
  population: Number,
  prefecture: { type: Schema.Types.ObjectId, ref: 'Prefecture' } // Référence à la préfecture
});

module.exports = mongoose.model('SousPrefecture', sousPrefectureSchema);
