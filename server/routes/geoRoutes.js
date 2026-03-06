// GEO Analysis Routes
const express    = require('express');
const router     = express.Router();
const geoCtrl   = require('../controllers/geoController');

// Existing endpoint — analyze pre-computed results
router.post('/analyze-geo-results', geoCtrl.analyzeGeoResults);

// Session Management Routes
/**
 * POST /api/geo/session
 * Create a new GEO analysis session
 */
router.post('/session', geoCtrl.createSession);

/**
 * GET /api/geo/sessions/:product_id
 * Get all sessions for a product
 */
router.get('/sessions/:product_id', geoCtrl.getProductSessions);

/**
 * GET /api/geo/session/:product_id/:session_id
 * Get full details of a specific session
 */
router.get('/session/:product_id/:session_id', geoCtrl.getSessionDetails);

// Update Operations Routes
/**
 * POST /api/geo/session/:product_id/:session_id/questions
 * Add or update questions in a session
 */
router.post('/session/:product_id/:session_id/questions', geoCtrl.addQuestionsToSession);

/**
 * POST /api/geo/session/:product_id/:session_id/answers
 * Add or update answers in a session
 */
router.post('/session/:product_id/:session_id/answers', geoCtrl.addAnswersToSession);

/**
 * PATCH /api/geo/session/:product_id/:session_id/models
 * Update models_used list for a session
 */
router.patch('/session/:product_id/:session_id/models', geoCtrl.updateModelsUsed);

/**
 * PATCH /api/geo/session/:product_id/:session_id/metadata
 * Update session metadata (product_name, competitors, vectorCollection)
 */
router.patch('/session/:product_id/:session_id/metadata', geoCtrl.updateSessionMetadata);

module.exports = router;
