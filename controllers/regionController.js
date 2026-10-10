const { serializeRecord } = require('../utils/populationResponse');
const { prefectureFilter } = require('../utils/administrativeData');
const { getStats } = require('../utils/administrativeStats');
const { activeFilter } = require('../utils/administrativeData');
const { escapeName } = require('../utils/searchName');
const Region = require('../models/regionModel');
const Prefecture = require('../models/prefectureModel'); 

// Créer une nouvelle région
exports.createRegion = async (req, res, next) => {
  try {
    const region = new Region(req.body);
    const savedRegion = await region.save();
    res.status(201).json(serializeRecord(savedRegion, { ...req.populationOptions, kind: 'regions' }));
  } catch (error) {
    next(error);
  }
};

// Lire toutes les régions
exports.getAllRegions = async (req, res, next) => {
  try {
    const regions = await Region.find(activeFilter).select('-_id -__v');
    res.status(200).json(serializeRecord(regions, { ...req.populationOptions, kind: 'regions' }));
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
  
      const region = await Region.findOne({ ...activeFilter, name: new RegExp(escapeName(name), 'i') }).select('-_id -__v'); // recherche insensible à la casse
  
      if (!region) {
        return res.status(404).json({
          message: "Région non trouvée",
          code: 404
        });
      }
  
      res.status(200).json(serializeRecord(region, { ...req.populationOptions, kind: 'regions' }));
    } catch (error) {
      next(error);
    }
  };

  exports.getRegionStats = async (req, res, next) => {
    try { res.status(200).json(await getStats(Region, activeFilter, { kind: 'regions', count: 'totalRegions', most: 'mostPopulatedRegion', largest: 'largestRegion' })); }
    catch (error) { next(error); }
  };
  
  exports.getPrefecturesByRegionName = async (req, res, next) => {
    try {
      const regionName = req.params.name;
  
      const region = await Region.findOne({ ...activeFilter, name: new RegExp(`^${escapeName(regionName)}$`, 'i') });
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
  
