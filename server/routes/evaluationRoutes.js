const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

// POST /api/evaluate/
router.post('/', evaluationController.evaluateQuestions);

module.exports = router;
