// AWS Services Routes Examples
const express = require('express');
const logger = require('../utils/logger');
const { dynamodbService, lambdaService } = require('../services/awsServices');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const router = express.Router();

/**
 * DynamoDB Routes
 */

// Get all items from DynamoDB
router.get('/data', async (req, res) => {
  try {
    const result = await dynamodbService.scan();
    res.json(successResponse(result.data, 'Data retrieved successfully'));
  } catch (error) {
    logger.error(`Error fetching data: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Get a specific item by ID
router.get('/data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dynamodbService.getItem(id);
    if (!result.success) {
      return res.status(404).json(errorResponse('Item not found'));
    }
    res.json(successResponse(result.data, 'Item retrieved successfully'));
  } catch (error) {
    logger.error(`Error fetching item: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Create a new item in DynamoDB
router.post('/data', async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) {
      return res.status(400).json(errorResponse('ID is required'));
    }

    const item = {
      id,
      ...rest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await dynamodbService.createItem(item);
    res.status(201).json(successResponse(item, 'Item created successfully'));
  } catch (error) {
    logger.error(`Error creating item: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Update an item in DynamoDB
router.put('/data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const result = await dynamodbService.updateItem(id, updates);
    res.json(successResponse(result.data, 'Item updated successfully'));
  } catch (error) {
    logger.error(`Error updating item: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Delete an item from DynamoDB
router.delete('/data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dynamodbService.deleteItem(id);
    res.json(successResponse(null, 'Item deleted successfully'));
  } catch (error) {
    logger.error(`Error deleting item: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

/**
 * Lambda Routes
 */

// List all Lambda functions
router.get('/lambda/functions', async (req, res) => {
  try {
    const result = await lambdaService.listFunctions();
    res.json(successResponse(result.data, `Found ${result.count} Lambda functions`));
  } catch (error) {
    logger.error(`Error listing Lambda functions: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Get Lambda function configuration
router.get('/lambda/config/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const result = await lambdaService.getFunctionConfig(functionName);
    res.json(successResponse(result.data, 'Function configuration retrieved'));
  } catch (error) {
    logger.error(`Error getting Lambda config: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Invoke Lambda function
router.post('/lambda/invoke/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const payload = req.body;

    const result = await lambdaService.invokeFunction(payload, functionName);
    if (!result.success) {
      return res.status(500).json(errorResponse(result.error));
    }

    res.json(successResponse(result.data, 'Lambda function invoked successfully'));
  } catch (error) {
    logger.error(`Error invoking Lambda: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Invoke Lambda function asynchronously
router.post('/lambda/invoke-async/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const payload = req.body;

    const result = await lambdaService.invokeFunctionAsync(payload, functionName);
    res.json(successResponse(result, 'Lambda function invoked asynchronously'));
  } catch (error) {
    logger.error(`Error invoking Lambda asynchronously: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

// Process data with Lambda (example workflow)
router.post('/lambda/process-data', async (req, res) => {
  try {
    const { id, data } = req.body;

    if (!id || !data) {
      return res.status(400).json(errorResponse('ID and data are required'));
    }

    // Invoke Lambda with data
    const lambdaPayload = {
      action: 'process',
      id,
      data,
      timestamp: new Date().toISOString(),
    };

    const lambdaResult = await lambdaService.invokeFunction(
      lambdaPayload,
      'ai-bharat-processor'
    );

    if (!lambdaResult.success) {
      throw new Error(lambdaResult.error);
    }

    // Store result in DynamoDB
    const processedData = {
      id,
      rawData: data,
      processedResult: lambdaResult.data.payload,
      status: 'completed',
      processedAt: new Date().toISOString(),
    };

    await dynamodbService.createItem(processedData);

    res.json(successResponse(processedData, 'Data processed and stored successfully'));
  } catch (error) {
    logger.error(`Error processing data: ${error.message}`);
    res.status(500).json(errorResponse(error.message));
  }
});

module.exports = router;
