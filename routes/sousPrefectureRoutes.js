const express = require('express');
const router = express.Router();
const { validateSearchName } = require('../utils/searchName');
const sousPrefectureController = require('../controllers/sousPrefectureController');


// Obtenir toutes les sous-préfectures
router.get('/sous-prefectures', sousPrefectureController.getAllSousPrefectures);

// Filtrer par nom
router.get('/sous-prefectures/search', validateSearchName, sousPrefectureController.getSousPrefectureByName);

module.exports = router;
