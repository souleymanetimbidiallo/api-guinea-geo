const { serializeRecord } = require('../utils/populationResponse');
const { getStats } = require('../utils/administrativeStats');
const { prefectureFilter } = require('../utils/administrativeData');
const { escapeName } = require('../utils/searchName');
const Prefecture = require('../models/prefectureModel');
const Region = require('../models/regionModel');

// Créer une nouvelle préfecture
exports.createPrefecture = async (req, res, next) => {
  try {
    const prefecture = new Prefecture(req.body);
    const savedPrefecture = await prefecture.save();
    res.status(201).json(serializeRecord(savedPrefecture, { ...req.populationOptions, kind: 'prefectures' }));
  } catch (error) {
    next(error);
  }
};

// Lire toutes les préfectures
exports.getAllPrefectures = async (req, res, next) => {
  try {
    const prefectures = await Prefecture.find(prefectureFilter)
      .select('-_id -__v')
      .populate('region', 'name -_id');
    res.status(200).json(serializeRecord(prefectures, { ...req.populationOptions, kind: 'prefectures' }));
  } catch (error) {
    next(error);
  }
};

// Lire les préfectures par nom de région
exports.getPrefecturesByRegionName = async (req, res, next) => {
  try {
    const regionName = req.params.name;
    const region = await Region.findOne({ name: new RegExp(`^${escapeName(regionName)}$`, 'i') });

    if (!region) {
      return res.status(404).json({ message: "Région non trouvée", code: 404 });
    }

    const prefectures = await Prefecture.find({ ...prefectureFilter, region: region._id, parentStatus: { $ne: 'pending' } }).select('-_id -__v');
    if (!prefectures.length) {
      return res.status(404).json({ message: "Aucune préfecture trouvée pour cette région", code: 404 });
    }

    res.status(200).json(serializeRecord(prefectures, { ...req.populationOptions, kind: 'prefectures' }));
  } catch (error) {
    next(error);
  }
};

exports.getPrefectureStats = async (req, res, next) => {
    try { res.status(200).json(await getStats(Prefecture, prefectureFilter, { kind: 'prefectures', count: 'totalPrefectures', most: 'mostPopulatedPrefecture', largest: 'largestPrefecture' })); }
    catch (error) { next(error); }
  };
  
  
  exports.getPrefectureByName = async (req, res, next) => {
    try {
      const { name } = req.query;
  
      if (!name) {
        return res.status(400).json({ message: "Veuillez fournir un nom de préfecture avec ?name=..." });
      }
  
      const prefecture = await Prefecture.findOne({ ...prefectureFilter, name: new RegExp(`^${escapeName(name)}$`, 'i') })
        .select('-_id -__v')
        .populate('region', 'name -_id');
  
      if (!prefecture) {
        return res.status(404).json({ message: "Préfecture non trouvée", code: 404 });
      }
  
      res.status(200).json(serializeRecord(prefecture, { ...req.populationOptions, kind: 'prefectures' }));
    } catch (error) {
      next(error);
    }
  };
  