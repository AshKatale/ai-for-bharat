const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// POST /api/questions/generate
router.post('/generate', questionController.generateQuestions);

module.exports = router;
