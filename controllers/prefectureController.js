const Prefecture = require('../models/prefectureModel');
const Region = require('../models/regionModel');

// Créer une nouvelle préfecture
exports.createPrefecture = async (req, res, next) => {
  try {
    const prefecture = new Prefecture(req.body);
    const savedPrefecture = await prefecture.save();
    res.status(201).json(savedPrefecture);
  } catch (error) {
    next(error);
  }
};

// Lire toutes les préfectures
exports.getAllPrefectures = async (req, res, next) => {
  try {
    const prefectures = await Prefecture.find()
      .select('-_id -__v')
      .populate('region', 'name -_id');
    res.status(200).json(prefectures);
  } catch (error) {
    next(error);
  }
};

// Lire les préfectures par nom de région
exports.getPrefecturesByRegionName = async (req, res, next) => {
  try {
    const regionName = req.params.name;
    const region = await Region.findOne({ name: new RegExp(`^${regionName}$`, 'i') });

    if (!region) {
      return res.status(404).json({ message: "Région non trouvée", code: 404 });
    }

    const prefectures = await Prefecture.find({ region: region._id }).select('-_id -__v');
    if (!prefectures.length) {
      return res.status(404).json({ message: "Aucune préfecture trouvée pour cette région", code: 404 });
    }

    res.status(200).json(prefectures);
  } catch (error) {
    next(error);
  }
};

exports.getPrefectureStats = async (req, res, next) => {
    try {
      const totalPrefectures = await Prefecture.countDocuments();
  
      const totalPopulation = await Prefecture.aggregate([
        { $group: { _id: null, total: { $sum: "$population" } } }
      ]);
  
      const mostPopulated = await Prefecture.findOne().sort({ population: -1 }).limit(1);
      const largestPrefecture = await Prefecture.findOne().sort({ area: -1 }).limit(1);
  
      res.status(200).json({
        totalPrefectures,
        totalPopulation: totalPopulation[0]?.total || 0,
        mostPopulatedPrefecture: mostPopulated?.name || null,
        largestPrefecture: largestPrefecture?.name || null
      });
    } catch (error) {
      next(error);
    }
  };
  
  
  exports.getPrefectureByName = async (req, res, next) => {
    try {
      const { name } = req.query;
  
      if (!name) {
        return res.status(400).json({ message: "Veuillez fournir un nom de préfecture avec ?name=..." });
      }
  
      const prefecture = await Prefecture.findOne({ name: new RegExp(`^${name}$`, 'i') })
        .select('-_id -__v')
        .populate('region', 'name -_id');
  
      if (!prefecture) {
        return res.status(404).json({ message: "Préfecture non trouvée", code: 404 });
      }
  
      res.status(200).json(prefecture);
    } catch (error) {
      next(error);
    }
  };
  