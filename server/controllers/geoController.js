// GEO (Generative Engine Optimisation) Analysis Controller
// Accepts multi-model AI answer results, fetches ONE vector context call,
// and sends everything to Gemini for deep GEO analysis.
const axios  = require('axios');
const logger = require('../utils/logger');
const { BAD_REQUEST, OK } = require('../constants/statusCodes');
const { generateJSON } = require('../services/geminiService');

// ─── Config ───────────────────────────────────────────────────────────────────

const VECTOR_DB_URL        = process.env.VECTOR_DB_URL        || 'http://localhost:8081';
const VECTOR_COLLECTION    = process.env.VECTOR_DB_COLLECTION || 'productsdetails';
const VECTOR_CONTEXT_LIMIT = parseInt(process.env.VECTOR_CONTEXT_LIMIT || '8', 10);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if a model answer is a real response (not an error string). */
const isValidAnswer = (text) =>
  typeof text === 'string' &&
  text.trim().length > 0 &&
  !text.toLowerCase().startsWith('gemini error') &&
  !text.toLowerCase().startsWith('error') &&
  !text.toLowerCase().includes('api key') &&
  !text.toLowerCase().includes('api_key_invalid');

// ─── Fetch Product Context (single call) ─────────────────────────────────────

const fetchProductContext = async (productName, collection = VECTOR_COLLECTION) => {
  try {
    logger.info(`Fetching vector context for "${productName}" from ${collection}...`);
    const { data } = await axios.post(
      `${VECTOR_DB_URL}/api/vector/${collection}/search`,
      { queryText: productName, limit: VECTOR_CONTEXT_LIMIT, minSimilarity: 0.60 },
      { timeout: 15000 }
    );
    if (!data?.data?.length) return [];
    logger.info(`Vector DB returned ${data.data.length} context chunk(s).`);
    return data.data;
  } catch (err) {
    logger.warn(`Vector DB context fetch failed (non-fatal): ${err.message}`);
    return [];
  }
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

const buildGeoPrompt = ({ product_name, competitors, results, modelsUsed, productContext }) => {

  // ── Product knowledge base ──
  const contextBlock = productContext.length > 0
    ? productContext.map((chunk, i) =>
        `[CHUNK ${i + 1}] (similarity: ${chunk.$similarity?.toFixed(4) ?? 'N/A'}, source: ${chunk.metadata?.source_filename ?? 'unknown'})\n${chunk.text}`
      ).join('\n\n')
    : 'No product context available.';

  // ── Per-question multi-model answers block ──
  const answersBlock = results.map((r) => {
    const modelLines = modelsUsed.map(model => {
      const ans = r[model];
      if (!isValidAnswer(ans)) return `  [${model.toUpperCase()}]: (no valid answer / error)`;
      return `  [${model.toUpperCase()}]: ${ans}`;
    }).join('\n');
    return `QUESTION ${r.question_number}: ${r.question}\n${modelLines}`;
  }).join('\n\n---\n\n');

  const questionsList = results.map(r => `${r.question_number}. ${r.question}`).join('\n');
  const competitorsList = (competitors || []).join(', ') || 'none specified';

  return `
You are a GEO (Generative Engine Optimisation) analyst. Analyse how well the product "${product_name}" appears across multiple AI models' answers.

====== PRODUCT BEING ANALYSED ======
Product: ${product_name}
Competitors: ${competitorsList}
AI Models Evaluated: ${modelsUsed.join(', ')}

====== PRODUCT KNOWLEDGE BASE (from vector DB — use as ground truth) ======
${contextBlock}

====== QUESTIONS ASKED ======
${questionsList}

====== AI MODEL RESPONSES (per question, per model) ======
${answersBlock}

====== YOUR ANALYSIS TASK ======

For EACH question, analyse across ALL valid model answers:

A) AI Mention Analysis:
- Did "${product_name}" appear in ANY of the model answers for this question?
  - aiMentioned: true if mentioned in at least one valid model answer
- Which models mentioned it? (list them)
- What rank/position did the product appear at? (check for numbered lists 1. 2. 3.; if no list, estimate by order of appearance 1=first, 2=second, etc.; null if not mentioned)
  - Use the BEST rank across models (i.e. if GPT ranks it 1st, use 1)
- Sentiment across models:
  - "positive": recommended, best, top, excellent, ideal, preferred
  - "negative": criticized, avoid, poor, issues, limited
  - "neutral": mentioned without clear recommendation
  - Base on the most common or strongest sentiment across valid model answers

B) Competitor Analysis:
- Which competitors are mentioned in the model answers for this question?
- Which competitors rank ABOVE "${product_name}" across the model answers?
  - competitorsAbove: list competitors that appear before/ranked higher than the product

====== COMPUTE THESE AGGREGATED METRICS ======

- totalQuestions: ${results.length}
- totalMentionsInAI: count of questions where product appears in at least one model answer
- visibilityScore: (totalMentionsInAI / totalQuestions) × 100
- averageAIRank: mean of all non-null aiRank values (across all questions)
- positiveMentionRate: (questions with positive sentiment / totalMentionsInAI) × 100
- competitorDominanceScore: (questions where any competitor ranks above product / totalQuestions) × 100
- vectorCoverageScore: 0 (no per-question vector search was done — set to 0)
- averageVectorRank: null
- totalMentionsInVector: 0

====== GENERATE INSIGHTS (ground in product knowledge base) ======

highIntentMisses: Full question text of questions where product was NOT mentioned in any model answer.

weakRankingAreas: Full question text of questions where product rank > 3 across models.

competitorStrengthPatterns: For each question where a competitor ranks above the product, write one insight sentence referencing specific product features from the knowledge base. Be specific.

improvementSignals: Generate 4-5 specific, actionable recommendations grounded in the actual product features, pricing, and positioning from the knowledge base chunks. Reference real product attributes. Do NOT be generic.

====== OUTPUT FORMAT ======
Return ONLY this exact JSON. No markdown, no code fences, no explanation:

{
  "overview": {
    "visibilityScore": <number 0-100>,
    "vectorCoverageScore": 0,
    "averageAIRank": <number or null>,
    "averageVectorRank": null,
    "positiveMentionRate": <number 0-100>,
    "competitorDominanceScore": <number 0-100>,
    "totalQuestions": <number>,
    "totalMentionsInAI": <number>,
    "totalMentionsInVector": 0
  },
  "perQuestionAnalysis": [
    {
      "question": "<exact question text>",
      "aiMentioned": <true|false>,
      "modelsMentioned": ["gpt", "nova_pro"],
      "aiRank": <number or null>,
      "sentiment": "<positive|neutral|negative>",
      "vectorMentioned": false,
      "vectorRank": null,
      "similarityScore": null,
      "competitorsAbove": ["<competitor name>"]
    }
  ],
  "insights": {
    "highIntentMisses": ["<question text>"],
    "weakRankingAreas": ["<question text>"],
    "competitorStrengthPatterns": ["<specific insight>"],
    "improvementSignals": ["<specific actionable recommendation>"]
  }
}
`.trim();
};

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * POST /api/geo/analyze-geo-results
 *
 * Accepts the multi-model response body:
 * {
 *   product_name: string,
 *   competitors: string[],
 *   vectorCollection?: string,
 *   results: [{ question_number, question, gpt, gemini, nova_pro, ... }],
 *   models_used?: string[]   ← auto-detected if omitted
 * }
 */
exports.analyzeGeoResults = async (req, res, next) => {
  try {
    const {
      product_name,
      competitors      = [],
      results          = [],
      models_used,
      vectorCollection,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!product_name || typeof product_name !== 'string') {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_name (string) is required.',
      });
    }
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'results must be a non-empty array of { question_number, question, <model>: answer }.',
      });
    }

    // Auto-detect which model keys are present if models_used not provided
    const modelsUsed = models_used && models_used.length > 0
      ? models_used
      : Object.keys(results[0]).filter(k => !['question_number', 'question'].includes(k));

    logger.info(
      `GEO analysis started | product: "${product_name}" | ` +
      `${results.length} questions | models: [${modelsUsed.join(', ')}]`
    );

    // ── Step 1: ONE vector DB call for product context ────────────────────
    const productContext = await fetchProductContext(
      product_name,
      vectorCollection || VECTOR_COLLECTION,
    );

    // ── Step 2: Build prompt ──────────────────────────────────────────────
    const prompt = buildGeoPrompt({
      product_name,
      competitors,
      results,
      modelsUsed,
      productContext,
    });

    logger.info(`Prompt ready (${prompt.length} chars) — calling Gemini...`);

    // ── Step 3: Gemini analysis ───────────────────────────────────────────
    const analysis = await generateJSON(prompt);

    logger.info(
      `GEO analysis complete | ` +
      `visibility=${analysis?.overview?.visibilityScore}% | ` +
      `mentions=${analysis?.overview?.totalMentionsInAI}/${results.length}`
    );

    return res.status(OK).json({
      success:       true,
      product:       product_name,
      models:        modelsUsed,
      contextChunks: productContext.length,
      analysis,
    });

  } catch (err) {
    logger.error(`GEO analysis error: ${err.message}`);
    next(err);
  }
};

/**
 * POST /api/geo/session
 *
 * Store a new GEO analysis session in DynamoDB
 *
 * Request body:
 * {
 *   product_name: string,
 *   competitors?: string[],
 *   vectorCollection?: string,
 *   models_used?: string[],
 *   results?: [{ question_number, question, model_answers... }],
 *   analysis_results?: object
 * }
 */
exports.createSession = async (req, res, next) => {
  try {
    const {
      product_name,
      competitors,
      vectorCollection,
      models_used,
      results,
      analysis_results,
    } = req.body;

    if (!product_name || typeof product_name !== 'string') {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_name (string) is required.',
      });
    }

    logger.info(`Creating GEO analysis session for product: ${product_name}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const sessionResult = await geoService.createSession({
      product_name,
      competitors,
      vectorCollection,
      models_used,
      results,
      analysis_results,
    });

    return res.status(201).json(sessionResult);
  } catch (error) {
    logger.error(`Error creating GEO analysis session: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/geo/sessions/:product_id
 *
 * Fetch all analysis sessions for a product
 */
exports.getProductSessions = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id is required.',
      });
    }

    logger.info(`Fetching GEO sessions for product: ${product_id}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const result = await geoService.getProductSessions(product_id);

    return res.status(OK).json({
      success: result.success,
      data: result.data,
      count: result.data ? result.data.length : 0,
    });
  } catch (error) {
    logger.error(`Error fetching product sessions: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/geo/session/:product_id/:session_id
 *
 * Fetch full details of a specific GEO analysis session
 */
exports.getSessionDetails = async (req, res, next) => {
  try {
    const { product_id, session_id } = req.params;

    if (!product_id || !session_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id and session_id are required.',
      });
    }

    logger.info(`Fetching GEO session details: ${product_id} / ${session_id}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const result = await geoService.getSessionDetails(product_id, session_id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.',
      });
    }

    return res.status(OK).json({
      success: result.success,
      data: result.data,
    });
  } catch (error) {
    logger.error(`Error fetching session details: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/geo/session/:product_id/:session_id/questions
 *
 * Add or update questions in an existing session
 */
exports.addQuestionsToSession = async (req, res, next) => {
  try {
    const { product_id, session_id } = req.params;
    const { questions } = req.body;

    if (!product_id || !session_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id and session_id are required.',
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'questions must be a non-empty array with format: [{question_number, question}, ...]',
      });
    }

    logger.info(`Adding questions to session: ${product_id} / ${session_id}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const result = await geoService.addQuestionsToSession(product_id, session_id, questions);

    return res.status(OK).json({
      success: result.success,
      message: 'Questions added/updated successfully',
      data: {
        product_id: result.data.product_id,
        session_id: result.data.session_id,
        total_questions: result.data.questions.length,
        questions: result.data.questions,
      },
    });
  } catch (error) {
    logger.error(`Error adding questions: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/geo/session/:product_id/:session_id/answers
 *
 * Add or update answers for questions in an existing session
 */
exports.addAnswersToSession = async (req, res, next) => {
  try {
    const { product_id, session_id } = req.params;
    const { answers } = req.body;

    if (!product_id || !session_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id and session_id are required.',
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'answers must be a non-empty array with format: [{question_number, model_name: answer, ...}, ...]',
      });
    }

    logger.info(`Adding answers to session: ${product_id} / ${session_id}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const result = await geoService.addAnswersToSession(product_id, session_id, answers);

    return res.status(OK).json({
      success: result.success,
      message: 'Answers added/updated successfully',
      data: {
        product_id: result.data.product_id,
        session_id: result.data.session_id,
        total_answers: result.data.answers.length,
        answers: result.data.answers,
      },
    });
  } catch (error) {
    logger.error(`Error adding answers: ${error.message}`);
    next(error);
  }
};

/**
 * PATCH /api/geo/session/:product_id/:session_id/models
 *
 * Update models_used list for a session
 */
exports.updateModelsUsed = async (req, res, next) => {
  try {
    const { product_id, session_id } = req.params;
    const { models } = req.body;

    if (!product_id || !session_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id and session_id are required.',
      });
    }

    if (!Array.isArray(models) || models.length === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'models must be a non-empty array of model names.',
      });
    }

    logger.info(`Updating models used for session: ${product_id} / ${session_id}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const result = await geoService.updateModelsUsed(product_id, session_id, models);

    return res.status(OK).json({
      success: result.success,
      message: 'Models updated successfully',
      data: {
        product_id: result.data.product_id,
        session_id: result.data.session_id,
        models_used: result.data.models_used,
      },
    });
  } catch (error) {
    logger.error(`Error updating models: ${error.message}`);
    next(error);
  }
};

/**
 * PATCH /api/geo/session/:product_id/:session_id/metadata
 *
 * Update session metadata (product_name, competitors, vectorCollection)
 */
exports.updateSessionMetadata = async (req, res, next) => {
  try {
    const { product_id, session_id } = req.params;
    const { product_name, competitors, vectorCollection } = req.body;

    if (!product_id || !session_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id and session_id are required.',
      });
    }

    const metadata = {};
    if (product_name) metadata.product_name = product_name;
    if (competitors) metadata.competitors = competitors;
    if (vectorCollection) metadata.vectorCollection = vectorCollection;

    if (Object.keys(metadata).length === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'At least one field (product_name, competitors, vectorCollection) is required.',
      });
    }

    logger.info(`Updating session metadata: ${product_id} / ${session_id}`);

    const GEOAnalysisService = require('../services/geoAnalysisService');
    const geoService = new GEOAnalysisService();

    const result = await geoService.updateSessionMetadata(product_id, session_id, metadata);

    if (!result.success) {
      return res.status(BAD_REQUEST).json(result);
    }

    return res.status(OK).json({
      success: result.success,
      message: 'Session metadata updated successfully',
      data: {
        product_id: result.data.product_id,
        session_id: result.data.session_id,
        product_name: result.data.product_name,
        competitors: result.data.competitors,
        vectorCollection: result.data.vectorCollection,
      },
    });
  } catch (error) {
    logger.error(`Error updating session metadata: ${error.message}`);
    next(error);
  }
};
