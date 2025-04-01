const Commune = require('../models/communeModel');
const Region = require('../models/regionModel');

// Créer une nouvelle commune
exports.createCommune = async (req, res, next) => {
  try {
    const commune = new Commune(req.body);
    const saved = await commune.save();
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// Obtenir toutes les communes
exports.getAllCommunes = async (req, res, next) => {
  try {
    const communes = await Commune.find()
      .select('-_id -__v')
      .populate('region', 'name -_id');
    res.status(200).json(communes);
  } catch (error) {
    next(error);
  }
};

// Rechercher une commune par nom
exports.getCommuneByName = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Veuillez fournir un nom avec ?name=..." });
    }

    const commune = await Commune.findOne({ name: new RegExp(`^${name}$`, 'i') })
      .select('-_id -__v')
      .populate('region', 'name -_id');

    if (!commune) {
      return res.status(404).json({ message: "Commune non trouvée", code: 404 });
    }

    res.status(200).json(commune);
  } catch (error) {
    next(error);
  }
};
