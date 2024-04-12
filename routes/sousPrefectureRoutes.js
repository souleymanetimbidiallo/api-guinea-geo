const express = require('express');
const router = express.Router();
const SousPrefecture = require('../models/sousPrefectureModel'); // Assurez-vous que le chemin est correct

// Créer une nouvelle région
router.post('/sous-prefectures', async (req, res) => {
  try {
    const sousPrefecture = new Prefecture(req.body);
    const savedSousPrefecture = await sousPrefecture.save();
    res.status(201).send(savedSousPrefecture);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Lire toutes les régions
router.get('/sous-prefectures', async (req, res) => {
  try {
    const sousPrefectures = await SousPrefecture.find();
    res.status(200).send(sousPrefectures);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Ajoutez ici d'autres routes si nécessaire (mise à jour, suppression, etc.)

module.exports = router;
