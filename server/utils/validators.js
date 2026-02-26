// Validation Utilities

// Email validation
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Password validation (minimum 6 characters)
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Required field validation
const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// Number validation
const validateNumber = (value) => {
  return !isNaN(value) && value !== '';
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  validateNumber,
};
