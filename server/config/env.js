// Environment variables configuration
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/ai-bharat',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_key',
  API_KEY: process.env.API_KEY,

  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

  // DynamoDB Configuration
  DYNAMODB_REGION: process.env.DYNAMODB_REGION || 'ap-south-1',
  DYNAMODB_USERS_TABLE_NAME: process.env.DYNAMODB_USERS_TABLE_NAME || 'Users',
  DYNAMODB_PRODUCTS_TABLE_NAME: process.env.DYNAMODB_PRODUCTS_TABLE_NAME || 'Products',
  DYNAMODB_GEO_SESSIONS_TABLE_NAME: process.env.DYNAMODB_GEO_SESSIONS_TABLE_NAME || 'GEOAnalysisSessions',
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || 'https://dynamodb.ap-south-1.amazonaws.com',

  // Vector Database Configuration
  VECTOR_DB_URL: process.env.VECTOR_DB_URL || 'http://localhost:8081',
  VECTOR_DB_COLLECTION: process.env.VECTOR_DB_COLLECTION || 'productsdetails',
  VECTOR_CONTEXT_LIMIT: parseInt(process.env.VECTOR_CONTEXT_LIMIT || '8', 10),

  // AstraDB Configuration
  ASTRA_DB_TOKEN: process.env.ASTRA_DB_TOKEN,
  ASTRA_DB_ENDPOINT: process.env.ASTRA_DB_ENDPOINT,
  ASTRA_DB_KEYSPACE: process.env.ASTRA_DB_KEYSPACE,
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
};
