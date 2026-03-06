// AWS Services Initialization
const logger = require('../utils/logger');
const DynamoDBService = require('./dynamodbService');
const lambdaService = require('./lambdaService');
const { 
  DYNAMODB_USERS_TABLE_NAME, 
  DYNAMODB_PRODUCTS_TABLE_NAME,
  DYNAMODB_GEO_SESSIONS_TABLE_NAME 
} = require('../config/env');

// Initialize DynamoDB services for all tables
const usersDBService = new DynamoDBService(DYNAMODB_USERS_TABLE_NAME);
const productsDBService = new DynamoDBService(DYNAMODB_PRODUCTS_TABLE_NAME);

// GEO Analysis Sessions table with composite key: product_id (HASH) + session_id (RANGE)
const geoDBService = new DynamoDBService(
  DYNAMODB_GEO_SESSIONS_TABLE_NAME,
  {
    partitionKey: { name: 'product_id', type: 'S' },
    sortKey: { name: 'session_id', type: 'S' },
  }
);

/**
 * Initialize AWS services
 * @returns {Promise<void>}
 */
async function initializeAWSServices() {
  try {
    logger.info('Initializing AWS services...');

    // Initialize DynamoDB tables
    logger.info('Setting up DynamoDB Users table...');
    const usersTableResult = await usersDBService.createTable();
    if (usersTableResult.success) {
      logger.info('DynamoDB Users table initialized successfully');
    }

    logger.info('Setting up DynamoDB Products table...');
    const productsTableResult = await productsDBService.createTable();
    if (productsTableResult.success) {
      logger.info('DynamoDB Products table initialized successfully');
    }

    logger.info('Setting up DynamoDB GEO Analysis Sessions table...');
    const geoTableResult = await geoDBService.createTable();
    if (geoTableResult.success) {
      logger.info('DynamoDB GEO Analysis Sessions table initialized successfully');
    }

    // Verify Lambda connectivity
    logger.info('Verifying Lambda connectivity...');
    const functionsResult = await lambdaService.listFunctions();
    if (functionsResult.success) {
      logger.info(`Lambda is accessible. Found ${functionsResult.count} functions`);
    }

    logger.info('All AWS services initialized successfully');
    return { success: true };
  } catch (error) {
    logger.error(`Failed to initialize AWS services: ${error.message}`);
    // Don't exit, allow the server to start even if AWS is unavailable
    return { success: false, error: error.message };
  }
}

/**
 * Test AWS services connectivity
 * @returns {Promise<Object>} Status of AWS services
 */
async function testAWSConnectivity() {
  const results = {
    dynamodb: false,
    lambda: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Test DynamoDB Users table
    try {
      const scanResult = await usersDBService.scan({ Limit: 1 });
      results.dynamodb = scanResult.success;
    } catch (error) {
      logger.warn(`DynamoDB connectivity test failed: ${error.message}`);
      results.dynamodb = false;
    }

    // Test Lambda
    try {
      const listResult = await lambdaService.listFunctions();
      results.lambda = listResult.success;
    } catch (error) {
      logger.warn(`Lambda connectivity test failed: ${error.message}`);
      results.lambda = false;
    }

    return results;
  } catch (error) {
    logger.error(`AWS connectivity test error: ${error.message}`);
    return { ...results, error: error.message };
  }
}

module.exports = {
  initializeAWSServices,
  testAWSConnectivity,
  usersDBService,
  productsDBService,
  geoDBService,
  lambdaService,
};
