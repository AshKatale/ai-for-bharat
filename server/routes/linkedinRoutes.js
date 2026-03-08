const express = require('express');
const router = express.Router();
const linkedinController = require('../controllers/linkedinController');

// All paths inside handle both standard auth flow and posting
router.get('/auth/linkedin', linkedinController.getAuthUrl);
router.get('/auth/linkedin/callback', linkedinController.authCallback);
router.get('/auth/linkedin/status', linkedinController.getAuthStatus);

router.post('/linkedin/post', linkedinController.publishPost);

module.exports = router;