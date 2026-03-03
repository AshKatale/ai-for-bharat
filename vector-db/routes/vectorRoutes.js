// Vector Routes
const express = require('express');
const vc      = require('../controllers/vectorController');
const uc      = require('../controllers/uploadController');
const upload  = require('../middleware/uploadMiddleware');

const router = express.Router();

// ── Collection Management ──────────────────────────────────────────────────
router.get('/collections',             vc.listCollections);    // List all collections
router.post('/collections',            vc.createCollection);   // Create a collection
router.delete('/collections/:name',    vc.deleteCollection);   // Delete a collection

// ── Embedding Info ─────────────────────────────────────────────────────────
router.get('/embedding-info',          vc.embeddingInfo);      // Current model + dims

// ── File Upload ────────────────────────────────────────────────────────────
// POST multipart/form-data with field "file"
router.post('/:collection/upload',     upload.single('file'), uc.uploadDocument);

// ── Document CRUD ──────────────────────────────────────────────────────────
router.post('/:collection/documents',        vc.insertOne);    // Insert one doc
router.post('/:collection/documents/bulk',   vc.insertMany);   // Insert many docs
router.get('/:collection/documents',         vc.findMany);     // List docs
router.get('/:collection/documents/:id',     vc.findById);     // Get doc by ID
router.put('/:collection/documents/:id',     vc.updateById);   // Update doc by ID
router.delete('/:collection/documents/:id',  vc.deleteById);   // Delete doc by ID
router.delete('/:collection/documents',      vc.deleteMany);   // Delete many docs by filter

// ── Vector Search ──────────────────────────────────────────────────────────
router.post('/:collection/search',     vc.vectorSearch);       // Similarity search

// ── Utilities ──────────────────────────────────────────────────────────────
router.get('/:collection/count',       vc.countDocuments);     // Count docs
router.get('/:collection/inspect',     vc.inspectDocument);    // Debug: see raw field structure

module.exports = router;
