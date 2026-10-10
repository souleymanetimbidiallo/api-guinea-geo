const { serializeRecord } = require('../utils/populationResponse');
const { activeFilter } = require('../utils/administrativeData');
const { escapeName } = require('../utils/searchName');
const Commune = require('../models/CommuneModel');
const Region = require('../models/regionModel');

// Créer une nouvelle commune
exports.createCommune = async (req, res, next) => {
  try {
    const commune = new Commune(req.body);
    const saved = await commune.save();
    res.status(201).json(serializeRecord(saved, { ...req.populationOptions, kind: 'communes' }));
  } catch (error) {
    next(error);
  }
};

// Obtenir toutes les communes
exports.getAllCommunes = async (req, res, next) => {
  try {
    const communes = await Commune.find(activeFilter)
      .select('-_id -__v')
      .populate('region', 'name -_id');
    res.status(200).json(serializeRecord(communes, { ...req.populationOptions, kind: 'communes' }));
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

    const commune = await Commune.findOne({ ...activeFilter, name: new RegExp(`^${escapeName(name)}$`, 'i') })
      .select('-_id -__v')
      .populate('region', 'name -_id');

    if (!commune) {
      return res.status(404).json({ message: "Commune non trouvée", code: 404 });
    }

    res.status(200).json(serializeRecord(commune, { ...req.populationOptions, kind: 'communes' }));
  } catch (error) {
    next(error);
  }
};
