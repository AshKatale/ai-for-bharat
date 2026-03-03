// Gemini AI Service
// Singleton wrapper around @google/genai — configure GEMINI_API_KEY in .env
const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let _client = null;

/**
 * Returns (or lazily creates) the shared GoogleGenAI client instance.
 */
const getClient = () => {
  if (_client) return _client;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _client;
};

/**
 * Generate text content using Gemini.
 * @param {string} prompt       - The prompt / user message
 * @param {string} [model]      - Override the default model
 * @returns {Promise<string>}   - Generated text
 */
const generateContent = async (prompt, model = DEFAULT_MODEL) => {
  try {
    const ai = getClient();
    logger.info(`Calling Gemini model: ${model}`);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    logger.info('Gemini responded successfully.');
    return response.text;
  } catch (error) {
    logger.error(`Gemini generateContent error: ${error.message}`);
    throw new Error(`Gemini failed: ${error.message}`);
  }
};


/**
 * Generate structured JSON output from Gemini.
 * Wraps the prompt to request valid JSON and parses the response.
 * @param {string} prompt
 * @param {string} [model]
 * @returns {Promise<object>}
 */
const generateJSON = async (prompt, model = DEFAULT_MODEL) => {
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation, no code fences.`;
  const text = await generateContent(jsonPrompt, model);

  // ── Log raw Gemini response ──────────────────────────────────────────
  logger.info(`\n========== GEMINI RAW RESPONSE ==========\n${text}\n=========================================`);

  try {
    // Strip any accidental code fences if Gemini includes them
    const clean = text.replace(/^```json?\n?/i, '').replace(/```$/m, '').trim();
    return JSON.parse(clean);
  } catch (parseErr) {
    logger.error(`Failed to parse Gemini JSON response: ${text}`);
    throw new Error(`Gemini returned invalid JSON: ${parseErr.message}`);
  }
};


module.exports = { generateContent, generateJSON, DEFAULT_MODEL };
