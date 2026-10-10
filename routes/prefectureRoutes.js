const express = require('express');
const router = express.Router();
const { validateSearchName } = require('../utils/searchName');
const prefectureController = require('../controllers/prefectureController');

// Lire toutes les préfectures
router.get('/prefectures', prefectureController.getAllPrefectures);

// Obtenir les statistiques des préfectures
router.get('/prefectures/stats', prefectureController.getPrefectureStats);

// 
router.get('/prefectures/search', validateSearchName, prefectureController.getPrefectureByName);

module.exports = router;

