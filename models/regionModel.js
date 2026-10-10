const mongoose = require('mongoose');
const metadata = require('./administrativeMetadata');

const regionSchema = new mongoose.Schema({
  ...metadata,
  name: { type: String, required: true },
  zone: String,
  population: Number,
  area: Number, // Vous pouvez ajouter d'autres champs selon vos besoins
});

module.exports = mongoose.model('Region', regionSchema);
