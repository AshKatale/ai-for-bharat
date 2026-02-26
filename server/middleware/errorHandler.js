// Global Error Handler Middleware
const { SERVER_ERROR } = require('../constants/statusCodes');
const { SERVER_ERROR: SERVER_ERROR_MSG } = require('../constants/messages');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const status = err.status || SERVER_ERROR;
  const message = err.message || SERVER_ERROR_MSG;

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
  });
};

module.exports = errorHandler;
