const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');


/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Obtenir toutes les régions
 *     responses:
 *       200:
 *         description: Liste des régions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   zone:
 *                     type: string
 *                   population:
 *                     type: integer
 */
router.get('/regions', regionController.getAllRegions);

// Obtenir une région par nom
router.get('/regions/search', regionController.getRegionByName);

// Obtenir les statistiques des régions
router.get('/regions/stats', regionController.getRegionStats);

// Obtenir les préfectures d'une région par nom
router.get('/regions/:name/prefectures', regionController.getPrefecturesByRegionName);

module.exports = router;
