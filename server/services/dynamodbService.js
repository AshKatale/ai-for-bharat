// DynamoDB Service
const AWS = require('../config/aws');
const logger = require('../utils/logger');
const {
  DYNAMODB_REGION,
  DYNAMODB_USERS_TABLE_NAME,
  DYNAMODB_PRODUCTS_TABLE_NAME,
  DYNAMODB_ENDPOINT,
} = require('../config/env');

class DynamoDBService {
  constructor(tableName = DYNAMODB_USERS_TABLE_NAME) {
    this.dynamodb = new AWS.DynamoDB({
      region: DYNAMODB_REGION,
      endpoint: DYNAMODB_ENDPOINT,
    });
    this.documentClient = new AWS.DynamoDB.DocumentClient({
      region: DYNAMODB_REGION,
      endpoint: DYNAMODB_ENDPOINT,
    });
    this.tableName = tableName;
  }

  /**
   * Create a new item in DynamoDB
   * @param {Object} item - Item to store
   * @returns {Promise<Object>} Response from DynamoDB
   */
  async createItem(item) {
    const params = {
      TableName: this.tableName,
      Item: item,
    };

    try {
      logger.info(`Creating item in ${this.tableName}`);
      const result = await this.documentClient.put(params).promise();
      logger.info('Item created successfully');
      return { success: true, data: result };
    } catch (error) {
      logger.error(`Error creating item: ${error.message}`);
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  /**
   * Get an item from DynamoDB
   * @param {string} id - Primary key value
   * @param {string} keyName - Name of the primary key field (default: 'id')
   * @returns {Promise<Object>} Item from DynamoDB
   */
  async getItem(id, keyName = 'id') {
    const params = {
      TableName: this.tableName,
      Key: {
        [keyName]: id,
      },
    };

    try {
      logger.info(`Fetching item with ${keyName}: ${id}`);
      const result = await this.documentClient.get(params).promise();
      if (!result.Item) {
        logger.warn(`Item with ${keyName} ${id} not found`);
        return { success: false, data: null };
      }
      logger.info('Item fetched successfully');
      return { success: true, data: result.Item };
    } catch (error) {
      logger.error(`Error fetching item: ${error.message}`);
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
  }

  /**
   * Update an item in DynamoDB
   * @param {string} id - Primary key value
   * @param {Object} updates - Fields to update
   * @param {string} keyName - Name of the primary key field (default: 'id')
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(id, updates, keyName = 'id') {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      updateExpression.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = updates[key];
    });

    const params = {
      TableName: this.tableName,
      Key: { [keyName]: id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    try {
      logger.info(`Updating item with ${keyName}: ${id}`);
      const result = await this.documentClient.update(params).promise();
      logger.info('Item updated successfully');
      return { success: true, data: result.Attributes };
    } catch (error) {
      logger.error(`Error updating item: ${error.message}`);
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  /**
   * Delete an item from DynamoDB
   * @param {string} id - Primary key value
   * @param {string} keyName - Name of the primary key field (default: 'id')
   * @returns {Promise<Object>} Deletion result
   */
  async deleteItem(id, keyName = 'id') {
    const params = {
      TableName: this.tableName,
      Key: { [keyName]: id },
    };

    try {
      logger.info(`Deleting item with ${keyName}: ${id}`);
      const result = await this.documentClient.delete(params).promise();
      logger.info('Item deleted successfully');
      return { success: true, data: result };
    } catch (error) {
      logger.error(`Error deleting item: ${error.message}`);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Query items from DynamoDB
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} Query results
   */
  async query(queryParams) {
    try {
      logger.info('Executing query on DynamoDB');
      const result = await this.documentClient.query(queryParams).promise();
      logger.info(`Query returned ${result.Items.length} items`);
      return { success: true, data: result.Items, count: result.Count };
    } catch (error) {
      logger.error(`Error querying items: ${error.message}`);
      throw new Error(`Failed to query items: ${error.message}`);
    }
  }

  /**
   * Scan items from DynamoDB
   * @param {Object} scanParams - Scan parameters
   * @returns {Promise<Object>} Scan results
   */
  async scan(scanParams = {}) {
    const params = {
      TableName: this.tableName,
      ...scanParams,
    };

    try {
      logger.info('Scanning DynamoDB table');
      const result = await this.documentClient.scan(params).promise();
      logger.info(`Scan returned ${result.Items.length} items`);
      return { success: true, data: result.Items, count: result.Count };
    } catch (error) {
      logger.error(`Error scanning items: ${error.message}`);
      throw new Error(`Failed to scan items: ${error.message}`);
    }
  }

  /**
   * Create table if it doesn't exist
   * @returns {Promise<Object>} Table creation result
   */
  async createTable() {
    const params = {
      TableName: this.tableName,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing
    };

    try {
      logger.info(`Creating DynamoDB table: ${this.tableName}`);
      const result = await this.dynamodb.createTable(params).promise();
      logger.info('Table created successfully');
      return { success: true, data: result };
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        logger.info('Table already exists');
        return { success: true, message: 'Table already exists' };
      }
      logger.error(`Error creating table: ${error.message}`);
      throw new Error(`Failed to create table: ${error.message}`);
    }
  }
}

module.exports = DynamoDBService;
