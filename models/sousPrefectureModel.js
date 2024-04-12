const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sousPrefectureSchema = new Schema({
  name: { type: String, required: true },
  population: Number,
  prefecture: { type: Schema.Types.ObjectId, ref: 'Prefecture' } // Référence à la préfecture
});

module.exports = mongoose.model('SousPrefecture', sousPrefectureSchema);
