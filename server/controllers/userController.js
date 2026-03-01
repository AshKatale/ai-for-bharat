// User Controller
const { OK, CREATED, BAD_REQUEST, NOT_FOUND, SERVER_ERROR, UNAUTHORIZED } = require('../constants/statusCodes');
const { SUCCESS, CREATED_SUCCESSFULLY, NOT_FOUND: NOT_FOUND_MSG } = require('../constants/messages');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/jwtUtils');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by username
exports.getUserByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Create user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, username, company, location, website } = req.body;

    // Add validation logic here
    if (!name || !email || !password) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      username,
      company,
      location,
      website,
    });

    res.status(CREATED).json({
      success: true,
      message: CREATED_SUCCESSFULLY,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await User.updateById(id, updateData);

    if (!updatedUser) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    res.status(OK).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Update user password
exports.updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Old password and new password are required',
      });
    }

    const result = await User.updatePassword(id, oldPassword, newPassword);

    res.status(OK).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await User.deleteById(id);

    res.status(OK).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// User login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.verifyCredentials(email, password);

    if (!user) {
      return res.status(UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.status(OK).json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's products
exports.getUserProducts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    const products = await Product.findByUserId(userId);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Add product to user
exports.addProductToUser = async (req, res, next) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'UserId and productId are required',
      });
    }

    const user = await User.addProduct(userId, productId);

    res.status(OK).json({
      success: true,
      message: 'Product added to user successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from user
exports.removeProductFromUser = async (req, res, next) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'UserId and productId are required',
      });
    }

    const user = await User.removeProduct(userId, productId);

    res.status(OK).json({
      success: true,
      message: 'Product removed from user successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get users by role
exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;

    const users = await User.findByRole(role);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile (with products populated)
exports.getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get all products owned by user
    const products = await Product.findByUserId(userId);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: {
        ...user,
        productsCount: products.length,
        products: products,
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Sign Up
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, username } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user (User.create will hash the password)
    logger.info(`Creating user: ${email}`);
    const user = await User.create({
      name,
      email,
      password, // Pass plain password, User.create will hash it
      username: username || email.split('@')[0],
    });
    logger.info(`User created successfully: ${user.id || user.userId}`);

    // Generate token
    const token = generateToken(user.id || user.userId);

    res.status(CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id || user.userId,
          name: user.name,
          email: user.email,
          username: user.username,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    logger.info(`Login attempt for email: ${email}`);

    // Find user with password for authentication
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      logger.warn(`Login failed - User not found: ${email}`);
      return res.status(UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    logger.info(`User found: ${email}, verifying password...`);

    // Verify password using User model's method
    let isPasswordValid = false;
    try {
      isPasswordValid = await User._verifyPassword(password, user.password);
    } catch (error) {
      logger.error(`Password verification error: ${error.message}`, error);
      return res.status(UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!isPasswordValid) {
      logger.warn(`Login failed - Invalid password for user: ${email}`);
      return res.status(UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    logger.info(`Password verified successfully for: ${email}`);

    // Generate token
    const token = generateToken(user.userId || user.id);

    res.status(OK).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.userId || user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`Unexpected login error: ${error.message}`, error);
    next(error);
  }
};
