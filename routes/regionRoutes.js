const express = require('express');
const router = express.Router();
const Region = require('../models/regionModel'); // Assurez-vous que le chemin est correct

// Créer une nouvelle région
router.post('/regions', async (req, res) => {
  try {
    const region = new Region(req.body);
    const savedRegion = await region.save();
    res.status(201).send(savedRegion);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Lire toutes les régions
router.get('/regions', async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).send(regions);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Ajoutez ici d'autres routes si nécessaire (mise à jour, suppression, etc.)

module.exports = router;
