// Interact Routes
const express = require('express');
const router  = express.Router();
const { interact, listSkills } = require('../controllers/interactController');
const authMiddleware = require('../middleware/authMiddleware');

// GET  /api/interact/skills  — list all available skills (public)
router.get('/skills', listSkills);

// POST /api/interact          — run a skill (protected)
router.post('/', authMiddleware, interact);

module.exports = router;
