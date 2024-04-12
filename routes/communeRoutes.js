const express = require('express');
const router = express.Router();
const Commune = require('../models/CommuneModel'); // Assurez-vous que le chemin est correct

// Créer une nouvelle commune
router.post('/communes', async (req, res) => {
  try {
    const commune = new Commune(req.body);
    const savedCommune = await commune.save();
    res.status(201).send(savedCommune);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Lire toutes les communes
router.get('/communes', async (req, res) => {
  try {
    const communes = await Commune.find().populate('region');
    res.status(200).send(communes);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
