const evaluationService = require('../services/evaluationService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Endpoint to evaluate generated questions against multiple models (GPT, Gemini, Nova Pro)
 * POST /api/evaluate
 */
const evaluateQuestions = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return sendError(res, 400, 'Missing or invalid required field: questions array');
        }

        const result = await evaluationService.evaluateQuestions(questions);

        // Result already contains the multi-model structured output from the Lambda
        return sendSuccess(res, 200, 'Successfully evaluated questions across models', result);

    } catch (error) {
        logger.error(`Evaluation Controller Error: ${error.message}`);
        return sendError(res, 500, `Internal server error: ${error.message}`);
    }
};

module.exports = {
    evaluateQuestions
};
