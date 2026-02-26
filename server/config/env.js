// Environment variables configuration
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/ai-bharat',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_key',
  API_KEY: process.env.API_KEY,
};
