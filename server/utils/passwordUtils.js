// Password Utility Functions
const bcrypt = require('bcryptjs');
const logger = require('./logger');

// Hash Password
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw new Error('Password hashing failed');
  }
};

// Compare Password
const comparePassword = async (password, hashedPassword) => {
  try {
    if (!hashedPassword) {
      throw new Error('No hash provided');
    }
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error('Password comparison error:', error);
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
