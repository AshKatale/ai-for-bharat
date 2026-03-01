// Authentication Middleware
const { UNAUTHORIZED } = require('../constants/statusCodes');
const { UNAUTHORIZED: UNAUTHORIZED_MSG } = require('../constants/messages');
const { verifyToken } = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(UNAUTHORIZED).json({
        success: false,
        message: UNAUTHORIZED_MSG,
      });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(UNAUTHORIZED).json({
      success: false,
      message: error.message || UNAUTHORIZED_MSG,
    });
  }
};

module.exports = authMiddleware;
