// User Routes
const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/', userController.createUser);

// Get user by username (public)
router.get('/username/:username', userController.getUserByUsername);
router.get('/role/:role', userController.getUsersByRole);

// Protected routes
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.get('/:id/profile', authMiddleware, userController.getUserProfile);
router.get('/:userId/products', authMiddleware, userController.getUserProducts);

router.put('/:id', authMiddleware, userController.updateUser);
router.put('/:id/password', authMiddleware, userController.updatePassword);
router.delete('/:id', authMiddleware, userController.deleteUser);

// Product management routes
router.post('/:userId/products/add', authMiddleware, userController.addProductToUser);
router.post('/:userId/products/remove', authMiddleware, userController.removeProductFromUser);

module.exports = router;
