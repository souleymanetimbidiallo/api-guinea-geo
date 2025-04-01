const express = require('express');
const router = express.Router();
const quartierController = require('../controllers/quartierController');


// Obtenir tous les quartiers
router.get('/quartiers', quartierController.getAllQuartiers);

// Rechercher un quartier par nom
router.get('/quartiers/search', quartierController.getQuartierByName);

module.exports = router;
