const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { analyzeProductSentiment } = require('../controllers/sentimentController');
const { generateToken } = require('../utils/jwtUtils');

// Generate a dev token without needing DynamoDB (for testing Sentiment UI when AWS is down)
router.get('/dev-token', (req, res) => {
    try {
        const token = generateToken('demo-user-123');
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/sentiment/analyze/:productId
// Temporarily skipping JWT auth as requested by user
router.post('/analyze/:productId', analyzeProductSentiment);

module.exports = router;
