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

// Product lifecycle
router.put('/:id/publish', authMiddleware, productController.publishProduct);
router.put('/:id/archive', authMiddleware, productController.archiveProduct);

// Statistics management
router.put('/:id/stats', authMiddleware, productController.updateProductStats);
router.post('/:id/downloads/increment', productController.incrementDownloads);
router.post('/:id/views/increment', productController.incrementViews);

// Team management
router.post('/:productId/team/add', authMiddleware, productController.addTeamMember);
router.post('/:productId/team/remove', authMiddleware, productController.removeTeamMember);

module.exports = router;
