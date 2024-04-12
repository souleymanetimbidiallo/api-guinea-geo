const express = require('express');
const router = express.Router();
const Prefecture = require('../models/prefectureModel'); // Assurez-vous que le chemin est correct

// Créer une nouvelle région
router.post('/prefectures', async (req, res) => {
  try {
    const prefecture = new Prefecture(req.body);
    const savedPrefecture = await prefecture.save();
    res.status(201).send(savedPrefecture);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Lire toutes les régions
router.get('/prefectures', async (req, res) => {
  try {
    const prefectures = await Prefecture.find();
    res.status(200).send(prefectures);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Ajoutez ici d'autres routes si nécessaire (mise à jour, suppression, etc.)

module.exports = router;
