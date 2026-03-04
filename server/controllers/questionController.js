const questionService = require('../services/questionGenerationService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Generate 10 AI-ranking questions for a given product and search query
 * POST /api/questions/generate
 */
const generateQuestions = async (req, res) => {
    try {
        const { product_id, search_query } = req.body;

        if (!product_id) {
            return sendError(res, 400, 'Missing required field: product_id');
        }

        if (!search_query) {
            return sendError(res, 400, 'Missing required field: search_query');
        }

        const result = await questionService.generateQuestions(product_id, search_query);

        return sendSuccess(res, 200, 'Successfully generated questions', result.data);

    } catch (error) {
        logger.error(`Generate Questions Error: ${error.message}`);
        
        if (error.message.includes('not found in DynamoDB')) {
            return sendError(res, 404, error.message);
        }

        return sendError(res, 500, `Internal server error: ${error.message}`);
    }
};

module.exports = {
    generateQuestions
};
