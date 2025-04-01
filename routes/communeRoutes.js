const express = require('express');
const router = express.Router();
const communeController = require('../controllers/communeController');


// Obtenir toutes les communes
router.get('/communes', communeController.getAllCommunes);

// Rechercher une commune par nom
router.get('/communes/search', communeController.getCommuneByName);

module.exports = router;
