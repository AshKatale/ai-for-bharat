// Product Routes
const express = require('express');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes - Products listing and info
router.get('/', productController.getAllProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/search', productController.searchProducts);
router.post('/questions', productController.getProductQuestions);
router.get('/user/:userId', productController.getProductsByUser);
router.get('/:id', productController.getProductById);

// Protected routes - Create product
router.post('/', authMiddleware, productController.createProduct);

// Product management (protected)
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

// Video generation
router.post('/generate-video', productController.generateVideo);

module.exports = router;
