// Environment variables configuration
require('dotenv').config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/ai-bharat',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_key',
  API_KEY: process.env.API_KEY,
  
  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  
  // Lambda Configuration
  LAMBDA_SERVICE_URL: process.env.LAMBDA_SERVICE_URL || 'https://lambda.ap-south-1.amazonaws.com',
  LAMBDA_FUNCTION_NAME: process.env.LAMBDA_FUNCTION_NAME || 'ai-bharat-processor',
  LAMBDA_TIMEOUT: parseInt(process.env.LAMBDA_TIMEOUT) || 60,
  
  // DynamoDB Configuration
  DYNAMODB_REGION: process.env.DYNAMODB_REGION || 'ap-south-1',
  DYNAMODB_USERS_TABLE_NAME: process.env.DYNAMODB_USERS_TABLE_NAME || 'Users',
  DYNAMODB_PRODUCTS_TABLE_NAME: process.env.DYNAMODB_PRODUCTS_TABLE_NAME || 'Products',
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || 'https://dynamodb.ap-south-1.amazonaws.com',
};
