// Lambda Service
const AWS = require('../config/aws');
const axios = require('axios');
const logger = require('../utils/logger');
const {
  AWS_REGION,
  LAMBDA_FUNCTION_NAME,
  LAMBDA_TIMEOUT,
} = require('../config/env');

class LambdaService {
  constructor() {
    this.lambda = new AWS.Lambda({
      region: AWS_REGION,
    });
    this.functionName = LAMBDA_FUNCTION_NAME;
    this.timeout = LAMBDA_TIMEOUT;
  }

  /**
   * Invoke a Lambda function synchronously
   * @param {Object} payload - Payload to send to Lambda
   * @param {string} functionName - Lambda function name (optional)
   * @returns {Promise<Object>} Lambda response
   */
  async invokeFunction(payload, functionName = this.functionName) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'RequestResponse', // Synchronous invocation
      Payload: JSON.stringify(payload),
    };

    try {
      logger.info(`Invoking Lambda function: ${functionName}`);
      const result = await this.lambda.invoke(params).promise();
      
      const response = {
        statusCode: result.StatusCode,
        logResult: result.LogResult,
      };

      // Parse the payload if it's a string
      if (typeof result.Payload === 'string') {
        response.payload = JSON.parse(result.Payload);
      } else {
        response.payload = result.Payload;
      }

      // Check for function errors
      if (result.FunctionError) {
        logger.error(`Lambda function error: ${result.FunctionError}`);
        return {
          success: false,
          error: result.FunctionError,
          data: response.payload,
        };
      }

      logger.info('Lambda function invoked successfully');
      return { success: true, data: response };
    } catch (error) {
      logger.error(`Error invoking Lambda: ${error.message}`);
      throw new Error(`Failed to invoke Lambda: ${error.message}`);
    }
  }

  /**
   * Invoke a Lambda function asynchronously (fire and forget)
   * @param {Object} payload - Payload to send to Lambda
   * @param {string} functionName - Lambda function name (optional)
   * @returns {Promise<Object>} Invocation result
   */
  async invokeFunctionAsync(payload, functionName = this.functionName) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'Event', // Asynchronous invocation
      Payload: JSON.stringify(payload),
    };

    try {
      logger.info(`Invoking Lambda function asynchronously: ${functionName}`);
      const result = await this.lambda.invoke(params).promise();
      
      logger.info('Lambda function invoked asynchronously');
      return {
        success: true,
        statusCode: result.StatusCode,
        message: 'Function invoked asynchronously',
      };
    } catch (error) {
      logger.error(`Error invoking Lambda asynchronously: ${error.message}`);
      throw new Error(`Failed to invoke Lambda: ${error.message}`);
    }
  }

  /**
   * Get Lambda function configuration
   * @param {string} functionName - Lambda function name (optional)
   * @returns {Promise<Object>} Function configuration
   */
  async getFunctionConfig(functionName = this.functionName) {
    const params = {
      FunctionName: functionName,
    };

    try {
      logger.info(`Fetching config for Lambda function: ${functionName}`);
      const result = await this.lambda.getFunction(params).promise();
      
      logger.info('Function configuration fetched successfully');
      return {
        success: true,
        data: {
          name: result.Configuration.FunctionName,
          runtime: result.Configuration.Runtime,
          handler: result.Configuration.Handler,
          memory: result.Configuration.MemorySize,
          timeout: result.Configuration.Timeout,
          version: result.Configuration.Version,
        },
      };
    } catch (error) {
      logger.error(`Error fetching Lambda config: ${error.message}`);
      throw new Error(`Failed to fetch Lambda config: ${error.message}`);
    }
  }

  /**
   * List all Lambda functions
   * @returns {Promise<Object>} List of Lambda functions
   */
  async listFunctions() {
    const params = {};

    try {
      logger.info('Listing Lambda functions');
      const result = await this.lambda.listFunctions(params).promise();
      
      const functions = result.Functions.map(fn => ({
        name: fn.FunctionName,
        runtime: fn.Runtime,
        memory: fn.MemorySize,
        timeout: fn.Timeout,
        lastModified: fn.LastModified,
      }));

      logger.info(`Found ${functions.length} Lambda functions`);
      return { success: true, data: functions, count: functions.length };
    } catch (error) {
      logger.error(`Error listing Lambda functions: ${error.message}`);
      throw new Error(`Failed to list Lambda functions: ${error.message}`);
    }
  }

  /**
   * Update Lambda function environment variables
   * @param {Object} environment - Environment variables
   * @param {string} functionName - Lambda function name (optional)
   * @returns {Promise<Object>} Update result
   */
  async updateFunctionEnvironment(environment, functionName = this.functionName) {
    const params = {
      FunctionName: functionName,
      Environment: {
        Variables: environment,
      },
    };

    try {
      logger.info(`Updating environment for Lambda function: ${functionName}`);
      const result = await this.lambda.updateFunctionConfiguration(params).promise();
      
      logger.info('Function environment updated successfully');
      return {
        success: true,
        message: 'Environment variables updated',
        data: result.Environment,
      };
    } catch (error) {
      logger.error(`Error updating Lambda environment: ${error.message}`);
      throw new Error(`Failed to update Lambda environment: ${error.message}`);
    }
  }

  /**
   * Create Lambda function
   * @param {Object} config - Function configuration
   * @returns {Promise<Object>} Creation result
   */
  async createFunction(config) {
    const params = {
      FunctionName: config.name,
      Runtime: config.runtime || 'nodejs18.x',
      Role: config.role, // IAM role ARN
      Handler: config.handler || 'index.handler',
      Code: config.code,
      Timeout: config.timeout || this.timeout,
      MemorySize: config.memory || 128,
      Environment: config.environment || {},
    };

    try {
      logger.info(`Creating Lambda function: ${config.name}`);
      const result = await this.lambda.createFunction(params).promise();
      
      logger.info('Lambda function created successfully');
      return { success: true, data: result };
    } catch (error) {
      logger.error(`Error creating Lambda function: ${error.message}`);
      throw new Error(`Failed to create Lambda function: ${error.message}`);
    }
  }

  /**
   * Get AI-generated questions for a product via external Lambda Function URL
   * @param {string} productId - The product ID
   * @returns {Promise<Object>} Questions data from the Lambda service
   */
  async getProductQuestions(productId) {
    const LAMBDA_URL =
      'https://fj77afmr4pggcw6ggqr42cbida0zyhmd.lambda-url.ap-south-1.on.aws/';

    try {
      logger.info(`Fetching product questions for product: ${productId}`);

      const response = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Lambda URL returned ${response.status}: ${errorText}`);
        throw new Error(`Lambda service returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      logger.info(`Product questions fetched successfully for: ${productId}`);
      return { success: true, data };
    } catch (error) {
      logger.error(`Error fetching product questions: ${error.message}`);
      throw new Error(`Failed to fetch product questions: ${error.message}`);
    }
  }

  /**
   * Generate a marketing video via external Lambda Function URL
   * @param {Object} payload - { input_text, duration, seed }
   * @returns {Promise<Object>} Lambda response data
   */
  async generateVideo(payload) {
    const VIDEO_LAMBDA_URL =
      'https://mexugii3ermfzuzxjkbdlzm7si0ctlxa.lambda-url.ap-south-1.on.aws/';

    try {
      logger.info('Calling video generation Lambda URL');

      const response = await axios.post(VIDEO_LAMBDA_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      logger.info('Video generation Lambda responded successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data || error.message;
      logger.error(`Error calling video generation Lambda (${status}): ${JSON.stringify(message)}`);
      throw new Error(`Video generation Lambda failed: ${JSON.stringify(message)}`);
    }
  }

  /**
   * Delete Lambda function
   * @param {string} functionName - Lambda function name
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFunction(functionName) {
    const params = {
      FunctionName: functionName,
    };

    try {
      logger.info(`Deleting Lambda function: ${functionName}`);
      const result = await this.lambda.deleteFunction(params).promise();
      
      logger.info('Lambda function deleted successfully');
      return { success: true, message: 'Function deleted' };
    } catch (error) {
      logger.error(`Error deleting Lambda function: ${error.message}`);
      throw new Error(`Failed to delete Lambda function: ${error.message}`);
    }
  }
}

module.exports = new LambdaService();
