const { serializeRecord } = require('../utils/populationResponse');
const { activeFilter } = require('../utils/administrativeData');
const { escapeName } = require('../utils/searchName');
const SousPrefecture = require('../models/sousPrefectureModel');
const Prefecture = require('../models/prefectureModel');

// Créer une nouvelle sous-préfecture
exports.createSousPrefecture = async (req, res, next) => {
  try {
    const sousPrefecture = new SousPrefecture(req.body);
    const saved = await sousPrefecture.save();
    res.status(201).json(serializeRecord(saved, { ...req.populationOptions, kind: 'sous-prefectures' }));
  } catch (error) {
    next(error);
  }
};

// Lire toutes les sous-préfectures
exports.getAllSousPrefectures = async (req, res, next) => {
  try {
    const list = await SousPrefecture.find(activeFilter)
      .select('-_id -__v')
      .populate('prefecture', 'name -_id');
    res.status(200).json(serializeRecord(list, { ...req.populationOptions, kind: 'sous-prefectures' }));
  } catch (error) {
    next(error);
  }
};

// Filtrer une sous-préfecture par nom
exports.getSousPrefectureByName = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Veuillez fournir un nom avec ?name=..." });
    }

    const sousPrefecture = await SousPrefecture.findOne({ ...activeFilter, name: new RegExp(`^${escapeName(name)}$`, 'i') })
      .select('-_id -__v')
      .populate('prefecture', 'name -_id');

    if (!sousPrefecture) {
      return res.status(404).json({ message: "Sous-préfecture non trouvée", code: 404 });
    }

    res.status(200).json(serializeRecord(sousPrefecture, { ...req.populationOptions, kind: 'sous-prefectures' }));
  } catch (error) {
    next(error);
  }
};
