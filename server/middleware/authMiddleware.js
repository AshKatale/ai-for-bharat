// Authentication Middleware
const { UNAUTHORIZED } = require('../constants/statusCodes');
const { UNAUTHORIZED: UNAUTHORIZED_MSG } = require('../constants/messages');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(UNAUTHORIZED).json({
        success: false,
        message: UNAUTHORIZED_MSG,
      });
    }

    // Add your token verification logic here
    // Example: jwt.verify(token, JWT_SECRET)

    next();
  } catch (error) {
    res.status(UNAUTHORIZED).json({
      success: false,
      message: UNAUTHORIZED_MSG,
    });
  }
};

module.exports = authMiddleware;
