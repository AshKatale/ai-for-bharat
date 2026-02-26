// Response Handler Utility

const sendSuccess = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  });
};

const sendError = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && error && { error }),
  });
};

const sendPaginated = (res, statusCode, message, data, pagination) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};
