// Product Routes
const express = require('express');
const productController = require('../controllers/productController');
const { searchStream } = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes - Products listing and info
router.get('/', productController.getAllProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/search', productController.searchProducts);

// Real SSE streaming search — must be before /:id
router.get('/search/stream', searchStream);

router.get('/category/:category', productController.getProductsByCategory);
router.get('/status/:status', productController.getProductsByStatus);
router.get('/user/:userId', productController.getProductsByUser);
router.get('/:id', productController.getProductById);
router.get('/:id/with-owner', productController.getProductWithOwner);


// Protected routes - Create product
router.post('/', authMiddleware, productController.createProduct);

// Product management (protected)
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

// Video generation
router.post('/generate-video', productController.generateVideo);

// Image ad generation
router.post('/generate-image-ad', productController.generateImageAd);

module.exports = router;
