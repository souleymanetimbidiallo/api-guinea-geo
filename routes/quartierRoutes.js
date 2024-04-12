const express = require('express');
const router = express.Router();
const Quartier = require('../models/quartierModel'); // Assurez-vous que le chemin est correct

// Créer un nouveau quartier
router.post('/quartiers', async (req, res) => {
  try {
    const quartier = new Quartier(req.body);
    const savedQuartier = await quartier.save();
    res.status(201).send(savedQuartier);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Lire tous les quartiers
router.get('/quartiers', async (req, res) => {
  try {
    const quartiers = await Quartier.find().populate('commune').select('-_id -__v').then(data => res.send(data));;
    res.status(200).send(quartiers);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
