const Region = require('../models/regionModel');
const Prefecture = require('../models/prefectureModel'); 

// Créer une nouvelle région
exports.createRegion = async (req, res, next) => {
  try {
    const region = new Region(req.body);
    const savedRegion = await region.save();
    res.status(201).json(savedRegion);
  } catch (error) {
    next(error);
  }
};

// Lire toutes les régions
exports.getAllRegions = async (req, res, next) => {
  try {
    const regions = await Region.find().select('-_id -__v');
    res.status(200).json(regions);
  } catch (error) {
    next(error);
  }
};

// Obtenir une région par nom
exports.getRegionByName = async (req, res, next) => {
    try {
      const { name } = req.query;
  
      if (!name) {
        return res.status(400).json({
          message: "Veuillez fournir un nom de région en tant que paramètre ?name=Nom",
          code: 400
        });
      }
  
      const region = await Region.findOne({ name: new RegExp(name, 'i') }).select('-_id -__v'); // recherche insensible à la casse
  
      if (!region) {
        return res.status(404).json({
          message: "Région non trouvée",
          code: 404
        });
      }
  
      res.status(200).json(region);
    } catch (error) {
      next(error);
    }
  };

  exports.getRegionStats = async (req, res, next) => {
    try {
      const totalRegions = await Region.countDocuments();
  
      const totalPopulation = await Region.aggregate([
        { $group: { _id: null, total: { $sum: "$population" } } }
      ]);
  
      const mostPopulated = await Region.findOne().sort({ population: -1 });
      const largestRegion = await Region.findOne().sort({ area: -1 });
  
      res.status(200).json({
        totalRegions,
        totalPopulation: totalPopulation[0]?.total || 0,
        mostPopulatedRegion: mostPopulated?.name || null,
        largestRegion: largestRegion?.name || null
      });
    } catch (error) {
      next(error);
    }
  };
  
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
  
