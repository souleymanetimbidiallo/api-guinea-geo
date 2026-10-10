const express = require('express');
const router = express.Router();
const { validateSearchName } = require('../utils/searchName');
const communeController = require('../controllers/communeController');


// Obtenir toutes les communes
router.get('/communes', communeController.getAllCommunes);

// Rechercher une commune par nom
router.get('/communes/search', validateSearchName, communeController.getCommuneByName);

module.exports = router;
