// GEO Analysis Service
// Handles storing and retrieving GEO analysis sessions in DynamoDB
const DynamoDBService = require('./dynamodbService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class GEOAnalysisService {
  constructor() {
    const { DYNAMODB_GEO_SESSIONS_TABLE_NAME } = require('../config/env');
    this.tableName = DYNAMODB_GEO_SESSIONS_TABLE_NAME || 'GEOAnalysisSessions';
    this.dynamodbService = new DynamoDBService(this.tableName);
  }

  /**
   * Convert product name to product_id (lowercase, slug format)
   * @param {string} productName - Product name
   * @returns {string} Slugified product ID
   */
  static slugifyProductId(productName) {
    return productName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Extract questions and answers from results
   * @param {Array} results - Array of {question_number, question, model_answers, ...}
   * @returns {Object} {questions, answers}
   */
  static extractQuestionsAndAnswers(results, modelsUsed) {
    if (!Array.isArray(results) || results.length === 0) {
      return { questions: [], answers: [] };
    }

    const questions = [];
    const answers = [];

    results.forEach((result) => {
      const questionNum = result.question_number || questions.length + 1;

      // Extract question
      questions.push({
        question_number: questionNum,
        question: result.question || '',
      });

      // Extract answers from all models
      const answerObj = {
        question_number: questionNum,
      };

      if (modelsUsed && Array.isArray(modelsUsed)) {
        modelsUsed.forEach((model) => {
          // Try multiple possible field names for model answers
          answerObj[model] =
            result[model] ||
            result[`${model}_answer`] ||
            result[`answer_${model}`] ||
            result.answers?.[model] ||
            '';
        });
      } else {
        // If no models specified, extract all non-standard fields
        Object.keys(result).forEach((key) => {
          if (
            !['question_number', 'question', 'question_text', 'results'].includes(key)
          ) {
            answerObj[key] = result[key];
          }
        });
      }

      answers.push(answerObj);
    });

    return { questions, answers };
  }

  /**
   * Create a new GEO analysis session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async createSession(sessionData) {
    try {
      const {
        product_name,
        competitors = [],
        vectorCollection = 'productsdetails',
        models_used = [],
        results = [],
        analysis_results = {},
      } = sessionData;

      if (!product_name) {
        throw new Error('product_name is required');
      }

      // Generate product_id from product_name
      const product_id = GEOAnalysisService.slugifyProductId(product_name);

      // Generate unique session_id
      const session_id = `session_${Date.now()}_${uuidv4().substring(0, 8)}`;

      // Extract questions and answers from results
      const { questions, answers } = GEOAnalysisService.extractQuestionsAndAnswers(
        results,
        models_used
      );

      // Create session item
      const sessionItem = {
        product_id,
        session_id,
        product_name,
        competitors: Array.isArray(competitors) ? competitors : [competitors].filter(Boolean),
        vectorCollection,
        models_used: Array.isArray(models_used) ? models_used : [models_used].filter(Boolean),
        session_timestamp: Date.now(),
        questions,
        answers,
        analysis_results: analysis_results || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info(`Creating GEO analysis session for product: ${product_id}`);
      const result = await this.dynamodbService.createItem(sessionItem);

      if (!result.success) {
        throw new Error('Failed to create session in database');
      }

      logger.info(`GEO analysis session created successfully: ${session_id}`);
      return {
        success: true,
        data: {
          product_id,
          session_id,
          message: 'Session created successfully',
        },
      };
    } catch (error) {
      logger.error(`Error creating GEO analysis session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all sessions for a product
   * @param {string} product_id - Product ID
   * @returns {Promise<Array>} Array of sessions with summary
   */
  async getProductSessions(product_id) {
    try {
      if (!product_id) {
        throw new Error('product_id is required');
      }

      logger.info(`Fetching all sessions for product: ${product_id}`);

      const params = {
        TableName: this.tableName,
        KeyConditionExpression: 'product_id = :product_id',
        ExpressionAttributeValues: {
          ':product_id': product_id,
        },
        ScanIndexForward: false, // Latest sessions first
      };

      const result = await this.dynamodbService.documentClient.query(params).promise();

      if (!result.Items || result.Items.length === 0) {
        logger.warn(`No sessions found for product: ${product_id}`);
        return {
          success: true,
          data: [],
        };
      }

      // Return summary of sessions
      const sessions = result.Items.map((item) => ({
        session_id: item.session_id,
        product_id: item.product_id,
        product_name: item.product_name,
        timestamp: item.session_timestamp,
        createdAt: item.createdAt,
        number_of_questions: item.questions ? item.questions.length : 0,
        models_used: item.models_used || [],
        status: 'completed',
      }));

      logger.info(`Found ${sessions.length} sessions for product ${product_id}`);
      return {
        success: true,
        data: sessions,
      };
    } catch (error) {
      logger.error(`Error fetching product sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get full details of a specific session
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @returns {Promise<Object>} Session details
   */
  async getSessionDetails(product_id, session_id) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      logger.info(`Fetching session details: ${product_id} / ${session_id}`);

      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
      };

      const result = await this.dynamodbService.documentClient.get(params).promise();

      if (!result.Item) {
        logger.warn(`Session not found: ${product_id} / ${session_id}`);
        return {
          success: false,
          data: null,
        };
      }

      logger.info(`Session details retrieved successfully`);
      return {
        success: true,
        data: {
          product_id: result.Item.product_id,
          session_id: result.Item.session_id,
          product_name: result.Item.product_name,
          competitors: result.Item.competitors || [],
          vectorCollection: result.Item.vectorCollection,
          models_used: result.Item.models_used || [],
          session_timestamp: result.Item.session_timestamp,
          createdAt: result.Item.createdAt,
          updatedAt: result.Item.updatedAt,
          questions: result.Item.questions || [],
          answers: result.Item.answers || [],
          analysis_results: result.Item.analysis_results || {},
        },
      };
    } catch (error) {
      logger.error(`Error fetching session details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update analysis results for a session
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @param {Object} analysis_results - Analysis results to store
   * @returns {Promise<Object>} Updated session
   */
  async updateSessionAnalysis(product_id, session_id, analysis_results) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      logger.info(`Updating analysis results for session: ${product_id} / ${session_id}`);

      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
        UpdateExpression: 'SET analysis_results = :analysis_results, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':analysis_results': analysis_results || {},
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamodbService.documentClient.update(params).promise();

      logger.info(`Analysis results updated successfully`);
      return {
        success: true,
        data: result.Attributes,
      };
    } catch (error) {
      logger.error(`Error updating session analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add or update questions in an existing session
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @param {Array} questionsData - Array of {question_number, question}
   * @returns {Promise<Object>} Updated session
   */
  async addQuestionsToSession(product_id, session_id, questionsData) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        throw new Error('questionsData must be a non-empty array');
      }

      logger.info(`Adding questions to session: ${product_id} / ${session_id}`);

      // Get current session
      const sessionResult = await this.getSessionDetails(product_id, session_id);
      if (!sessionResult.success) {
        throw new Error('Session not found');
      }

      const currentQuestions = sessionResult.data.questions || [];

      // Merge new questions with existing ones (update by question_number)
      const questionMap = new Map(currentQuestions.map(q => [q.question_number, q]));

      questionsData.forEach((q) => {
        if (q.question_number && q.question) {
          questionMap.set(q.question_number, {
            question_number: q.question_number,
            question: q.question,
          });
        }
      });

      const updatedQuestions = Array.from(questionMap.values()).sort(
        (a, b) => a.question_number - b.question_number
      );

      // Update session
      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
        UpdateExpression: 'SET questions = :questions, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':questions': updatedQuestions,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamodbService.documentClient.update(params).promise();

      logger.info(`Questions added/updated successfully`);
      return {
        success: true,
        data: result.Attributes,
      };
    } catch (error) {
      logger.error(`Error adding questions to session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add or update answers for questions in a session
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @param {Array} answersData - Array of {question_number, model: answer, ...}
   * @returns {Promise<Object>} Updated session
   */
  async addAnswersToSession(product_id, session_id, answersData) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      if (!Array.isArray(answersData) || answersData.length === 0) {
        throw new Error('answersData must be a non-empty array');
      }

      logger.info(`Adding answers to session: ${product_id} / ${session_id}`);

      // Get current session
      const sessionResult = await this.getSessionDetails(product_id, session_id);
      if (!sessionResult.success) {
        throw new Error('Session not found');
      }

      const currentAnswers = sessionResult.data.answers || [];

      // Merge new answers with existing ones (update by question_number)
      const answerMap = new Map(currentAnswers.map(a => [a.question_number, a]));

      answersData.forEach((a) => {
        const qNum = a.question_number;
        if (qNum) {
          const existingAnswer = answerMap.get(qNum) || { question_number: qNum };
          // Merge model answers
          Object.keys(a).forEach((key) => {
            if (key !== 'question_number') {
              existingAnswer[key] = a[key];
            }
          });
          answerMap.set(qNum, existingAnswer);
        }
      });

      const updatedAnswers = Array.from(answerMap.values()).sort(
        (a, b) => a.question_number - b.question_number
      );

      // Update session
      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
        UpdateExpression: 'SET answers = :answers, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':answers': updatedAnswers,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamodbService.documentClient.update(params).promise();

      logger.info(`Answers added/updated successfully`);
      return {
        success: true,
        data: result.Attributes,
      };
    } catch (error) {
      logger.error(`Error adding answers to session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update models_used list for a session
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @param {Array} models - Array of model names
   * @returns {Promise<Object>} Updated session
   */
  async updateModelsUsed(product_id, session_id, models) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      if (!Array.isArray(models) || models.length === 0) {
        throw new Error('models must be a non-empty array');
      }

      logger.info(`Updating models_used for session: ${product_id} / ${session_id}`);

      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
        UpdateExpression: 'SET models_used = :models, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':models': models,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamodbService.documentClient.update(params).promise();

      logger.info(`Models updated successfully`);
      return {
        success: true,
        data: result.Attributes,
      };
    } catch (error) {
      logger.error(`Error updating models: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update session metadata (product_name, competitors, vectorCollection)
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @param {Object} metadata - Metadata to update
   * @returns {Promise<Object>} Updated session
   */
  async updateSessionMetadata(product_id, session_id, metadata) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      logger.info(`Updating session metadata: ${product_id} / ${session_id}`);

      const updateExpressions = [];
      const expressionAttributeValues = {};

      if (metadata.product_name) {
        updateExpressions.push('product_name = :product_name');
        expressionAttributeValues[':product_name'] = metadata.product_name;
      }

      if (metadata.competitors) {
        updateExpressions.push('competitors = :competitors');
        expressionAttributeValues[':competitors'] = Array.isArray(metadata.competitors)
          ? metadata.competitors
          : [metadata.competitors];
      }

      if (metadata.vectorCollection) {
        updateExpressions.push('vectorCollection = :vectorCollection');
        expressionAttributeValues[':vectorCollection'] = metadata.vectorCollection;
      }

      if (updateExpressions.length === 0) {
        return {
          success: false,
          data: null,
          message: 'No metadata fields to update',
        };
      }

      updateExpressions.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamodbService.documentClient.update(params).promise();

      logger.info(`Session metadata updated successfully`);
      return {
        success: true,
        data: result.Attributes,
      };
    } catch (error) {
      logger.error(`Error updating session metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a session
   * @param {string} product_id - Product ID
   * @param {string} session_id - Session ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSession(product_id, session_id) {
    try {
      if (!product_id || !session_id) {
        throw new Error('product_id and session_id are required');
      }

      logger.info(`Deleting session: ${product_id} / ${session_id}`);

      const params = {
        TableName: this.tableName,
        Key: {
          product_id,
          session_id,
        },
      };

      const result = await this.dynamodbService.documentClient.delete(params).promise();

      logger.info(`Session deleted successfully`);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error(`Error deleting session: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GEOAnalysisService;
