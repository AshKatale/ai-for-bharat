const axios = require('axios');
const logger = require('../utils/logger');

const LAMBDA_EVAL_URL = 'https://vy4s6yn3k53qagqlsb33dpdsrq0jnwtc.lambda-url.ap-south-1.on.aws/';

/**
 * Sends a list of generated questions to the external Multi-Model Lambda Service.
 * The Lambda will evaluate these questions against GPT, Gemini, and Nova Pro.
 * 
 * @param {Array} questions - Array of question objects { question_number, question }
 * @returns {Promise<Object>} The evaluation payload from the Lambda
 */
const evaluateQuestions = async (questions) => {
  try {
    logger.info(`[EvalService] Sending ${questions.length} questions to Multi-Model Lambda...`);
    
    // The lambda expects: { "questions": [...] }
    const response = await axios.post(
      LAMBDA_EVAL_URL,
      { questions },
      { headers: { 'Content-Type': 'application/json' } }
    );

    logger.info(`[EvalService] Received successful response from Lambda`);
    
    return response.data;
  } catch (error) {
    logger.error(`[EvalService] Failed to hit Lambda: ${error.message}`);
    
    // Attempt to extract response data if available
    if (error.response && error.response.data) {
       throw new Error(`Lambda returned error: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(`Failed to contact multi-model evaluation service: ${error.message}`);
  }
};

module.exports = {
  evaluateQuestions
};
