const express = require('express');
const router = express.Router();
const linkedinController = require('../controllers/linkedinController');

// All paths inside handle both standard auth flow and posting

// Auth flows (mapped via server.js later depending on how we want to prefix. 
// We will export a single router and mount it under different paths, or put them all under /api/linkedin.)
// Since specs requested `/auth/linkedin` and `/linkedin/post`, we can export them explicitly.

// Expose these as their respective endpoints
router.get('/auth/linkedin', linkedinController.getAuthUrl);
router.get('/auth/linkedin/callback', linkedinController.authCallback);
router.get('/auth/linkedin/status', linkedinController.getAuthStatus);

router.post('/linkedin/post', linkedinController.publishPost);

module.exports = router;
