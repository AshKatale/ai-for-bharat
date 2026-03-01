// JWT Utility Functions
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// Generate JWT Token
const generateToken = (userId, expiresIn = '24h') => {
  try {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn });
    return token;
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Decode Token without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Token decoding failed');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
