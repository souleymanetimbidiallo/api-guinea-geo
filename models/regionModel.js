const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zone: String,
  population: Number,
  area: Number, // Vous pouvez ajouter d'autres champs selon vos besoins
});

module.exports = mongoose.model('Region', regionSchema);
