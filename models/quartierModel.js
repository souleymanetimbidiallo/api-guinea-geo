const mongoose = require('mongoose');
const metadata = require('./administrativeMetadata');
const Schema = mongoose.Schema;

const quartierSchema = new Schema({
  ...metadata,
  name: { type: String, required: true },
  population: Number,
  commune: { type: Schema.Types.ObjectId, ref: 'Commune' } // Référence à la commune
});

module.exports = mongoose.model('Quartier', quartierSchema);