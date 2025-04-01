const Quartier = require('../models/quartierModel');
const Commune = require('../models/communeModel');

// Créer un quartier
exports.createQuartier = async (req, res, next) => {
  try {
    const quartier = new Quartier(req.body);
    const saved = await quartier.save();
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// Obtenir tous les quartiers
exports.getAllQuartiers = async (req, res, next) => {
  try {
    const quartiers = await Quartier.find()
      .select('-_id -__v')
      .populate('commune', 'name -_id');
    res.status(200).json(quartiers);
  } catch (error) {
    next(error);
  }
};

// Rechercher un quartier par nom
exports.getQuartierByName = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Veuillez fournir un nom avec ?name=..." });
    }

    const quartier = await Quartier.findOne({ name: new RegExp(`^${name}$`, 'i') })
      .select('-_id -__v')
      .populate('commune', 'name -_id');

    if (!quartier) {
      return res.status(404).json({ message: "Quartier non trouvé", code: 404 });
    }

    res.status(200).json(quartier);
  } catch (error) {
    next(error);
  }
};
