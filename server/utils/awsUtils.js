// AWS Utilities - Helper functions for common AWS operations
const logger = require('./logger');
const { dynamodbService, lambdaService } = require('../services/awsServices');

/**
 * Process data through Lambda and store result in DynamoDB
 * @param {Object} data - Data to process
 * @param {string} functionName - Lambda function name
 * @returns {Promise<Object>} Processing result
 */
async function processAndStore(data, functionName = 'ai-bharat-processor') {
  try {
    logger.info('Starting data processing workflow');

    // Invoke Lambda
    const lambdaResult = await lambdaService.invokeFunction(data, functionName);
    if (!lambdaResult.success) {
      throw new Error(`Lambda invocation failed: ${lambdaResult.error}`);
    }

    // Store result in DynamoDB
    const storageItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      input: data,
      output: lambdaResult.data,
      status: 'success',
      processedAt: new Date().toISOString(),
    };

    const storageResult = await dynamodbService.createItem(storageItem);
    if (!storageResult.success) {
      throw new Error('Failed to store result in DynamoDB');
    }

    logger.info('Data processing workflow completed successfully');
    return { success: true, data: storageItem };
  } catch (error) {
    logger.error(`Error in processAndStore: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Batch process data with Lambda
 * @param {Array} dataArray - Array of data to process
 * @param {string} functionName - Lambda function name
 * @returns {Promise<Object>} Batch processing result
 */
async function batchProcess(dataArray, functionName = 'ai-bharat-processor') {
  try {
    logger.info(`Starting batch processing for ${dataArray.length} items`);

    const promises = dataArray.map(data =>
      lambdaService.invokeFunctionAsync(data, functionName)
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    logger.info(`Batch processing completed: ${successful.length} successful, ${failed.length} failed`);

    return {
      success: true,
      processed: successful.length,
      failed: failed.length,
      results: results,
    };
  } catch (error) {
    logger.error(`Error in batchProcess: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieve and process stored data
 * @param {string} id - Item ID
 * @param {string} functionName - Lambda function to apply (optional)
 * @returns {Promise<Object>} Processed data
 */
async function retrieveAndProcess(id, functionName) {
  try {
    logger.info(`Retrieving item ${id}`);

    // Get item from DynamoDB
    const getResult = await dynamodbService.getItem(id);
    if (!getResult.success) {
      throw new Error('Item not found');
    }

    // If function name provided, process the data
    if (functionName) {
      const processResult = await lambdaService.invokeFunction(
        getResult.data,
        functionName
      );

      if (!processResult.success) {
        throw new Error(`Processing failed: ${processResult.error}`);
      }

      return {
        success: true,
        original: getResult.data,
        processed: processResult.data,
      };
    }

    return { success: true, data: getResult.data };
  } catch (error) {
    logger.error(`Error in retrieveAndProcess: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Search items in DynamoDB by attribute
 * @param {string} attribute - Attribute name to search
 * @param {*} value - Value to search for
 * @returns {Promise<Object>} Search results
 */
async function searchByAttribute(attribute, value) {
  try {
    logger.info(`Searching for ${attribute} = ${value}`);

    const scanParams = {
      FilterExpression: `${attribute} = :val`,
      ExpressionAttributeValues: {
        ':val': value,
      },
    };

    const result = await dynamodbService.scan(scanParams);
    logger.info(`Found ${result.data.length} items matching criteria`);

    return { success: true, data: result.data, count: result.count };
  } catch (error) {
    logger.error(`Error in searchByAttribute: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Generate report from DynamoDB data using Lambda
 * @param {Object} criteria - Search criteria
 * @param {string} functionName - Lambda function for report generation
 * @returns {Promise<Object>} Generated report
 */
async function generateReport(criteria, functionName = 'ai-bharat-processor') {
  try {
    logger.info('Starting report generation');

    // Get data from DynamoDB
    const scanParams = {};
    if (criteria.FilterExpression) {
      scanParams.FilterExpression = criteria.FilterExpression;
      scanParams.ExpressionAttributeValues = criteria.ExpressionAttributeValues;
    }

    const dataResult = await dynamodbService.scan(scanParams);
    if (!dataResult.success) {
      throw new Error('Failed to retrieve data');
    }

    // Generate report with Lambda
    const reportPayload = {
      action: 'generateReport',
      data: dataResult.data,
      criteria: criteria,
    };

    const reportResult = await lambdaService.invokeFunction(reportPayload, functionName);
    if (!reportResult.success) {
      throw new Error(`Report generation failed: ${reportResult.error}`);
    }

    // Store report in DynamoDB
    const reportItem = {
      id: `report-${Date.now()}`,
      type: 'report',
      criteria: criteria,
      dataCount: dataResult.data.length,
      report: reportResult.data,
      generatedAt: new Date().toISOString(),
    };

    await dynamodbService.createItem(reportItem);
    logger.info('Report generated and stored successfully');

    return { success: true, data: reportItem };
  } catch (error) {
    logger.error(`Error in generateReport: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Archive old items (mark as archived)
 * @param {number} daysOld - Items older than this many days
 * @returns {Promise<Object>} Archival result
 */
async function archiveOldItems(daysOld = 30) {
  try {
    logger.info(`Archiving items older than ${daysOld} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffTimestamp = cutoffDate.toISOString();

    // Scan for old items
    const scanParams = {
      FilterExpression: 'createdAt < :date',
      ExpressionAttributeValues: {
        ':date': cutoffTimestamp,
      },
    };

    const result = await dynamodbService.scan(scanParams);
    if (!result.success || result.data.length === 0) {
      logger.info('No items to archive');
      return { success: true, archived: 0 };
    }

    // Archive each item
    let archived = 0;
    for (const item of result.data) {
      await dynamodbService.updateItem(item.id, {
        archived: true,
        archivedAt: new Date().toISOString(),
      });
      archived++;
    }

    logger.info(`Archived ${archived} items`);
    return { success: true, archived: archived };
  } catch (error) {
    logger.error(`Error in archiveOldItems: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processAndStore,
  batchProcess,
  retrieveAndProcess,
  searchByAttribute,
  generateReport,
  archiveOldItems,
};
