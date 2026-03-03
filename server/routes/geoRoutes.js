// GEO Analysis Routes
const express    = require('express');
const router     = express.Router();
const geoCtrl   = require('../controllers/geoController');

// POST /api/geo/analyze-geo-results
// Pure analytical — no AI calls inside. Takes pre-computed answers + vector results.
router.post('/analyze-geo-results', geoCtrl.analyzeGeoResults);

module.exports = router;
