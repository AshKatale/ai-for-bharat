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
