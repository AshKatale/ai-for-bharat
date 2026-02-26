// User Controller
const { OK, CREATED, BAD_REQUEST, NOT_FOUND, SERVER_ERROR } = require('../constants/statusCodes');
const { SUCCESS, CREATED_SUCCESSFULLY, NOT_FOUND: NOT_FOUND_MSG } = require('../constants/messages');
const User = require('../models/User');

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

// Create user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Add validation logic here
    if (!name || !email || !password) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const user = await User.create({ name, email, password });
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

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await User.deleteById(id);

    if (!result) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    res.status(OK).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
