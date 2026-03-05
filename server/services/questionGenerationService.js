// Question Generation Service
const { DataAPIClient } = require('@datastax/astra-db-ts');
const { pipeline } = require('@xenova/transformers');
const { generateJSON, DEFAULT_MODEL } = require('./geminiService');
const DynamoDBService = require('./dynamodbService');
const logger = require('../utils/logger');
const {
  DYNAMODB_PRODUCTS_TABLE_NAME,
  ASTRA_DB_TOKEN,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_KEYSPACE,
  EMBEDDING_MODEL,
} = require('../config/env');

const productsDBService = new DynamoDBService(DYNAMODB_PRODUCTS_TABLE_NAME);

// --- AstraDB Config ---
const ASTRA_COLLECTION = process.env.ASTRA_DB_COLLECTION || 'productsdetails';

let astraDb = null;
let embeddingPipeline = null;

/**
 * Lazy init AstraDB
 */
const getAstraDb = async () => {
  if (astraDb) return astraDb;

  if (!ASTRA_DB_TOKEN || !ASTRA_DB_ENDPOINT) {
    throw new Error('ASTRA_DB_TOKEN and ASTRA_DB_ENDPOINT must be configured in .env');
  }

  const client = new DataAPIClient(ASTRA_DB_TOKEN);
  astraDb = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_KEYSPACE || 'default_keyspace' });
  logger.info(`✅ Connected to AstraDB from server. Collection: ${ASTRA_COLLECTION}`);
  return astraDb;
};

/**
 * Lazy init Embedding Pipeline
 */
const getEmbeddingPipeline = async () => {
  if (embeddingPipeline) return embeddingPipeline;

  const modelName = EMBEDDING_MODEL || 'Xenova/e5-large-v2';
  logger.info(`⏳ Loading embedding model: ${modelName} (first run downloads model, cached after)...`);
  
  embeddingPipeline = await pipeline('feature-extraction', modelName);
  logger.info(`✅ Embedding model ready!`);
  
  return embeddingPipeline;
};

/**
 * Generate 10 questions using product data + RAG context from AstraDB via Gemini
 * @param {string} productId 
 * @param {string} searchQuery 
 * @returns {Promise<Object>} Generated questions JSON
 */
const generateQuestions = async (productId, searchQuery) => {
  try {
    logger.info(`[QuestionGen] Starting pipeline for product_id: ${productId}, search_query: "${searchQuery}"`);

    // 1. Fetch Product from DynamoDB
    const dbResult = await productsDBService.getItem(productId, 'productId');
    
    // Explicitly check for successful fetch
    let productData = null;
    let productName = 'Unknown Product';
    
    if (dbResult && dbResult.success && dbResult.data) {
      productData = dbResult.data;
      productName = productData.name || productData.title || productName;
      logger.info(`[QuestionGen] Fetched product data successfully.`);
    } else {
      // If we don't strict-fail on DynamoDB, we can still generate using search query, 
      // but lambda snippet threw an error. Let's throw.
      throw new Error(`Product '${productId}' not found in DynamoDB.`);
    }

    // 2. Embed Search Query
    const embedder = await getEmbeddingPipeline();
    // 'e5-large-v2' recommends prefixing queries with "query: " 
    const queryPrefix = (EMBEDDING_MODEL || '').includes('e5') ? 'query: ' : '';
    const textToEmbed = queryPrefix + searchQuery.trim();
    
    const output = await embedder(textToEmbed, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    // 3. Vector Search on AstraDB
    const db = await getAstraDb();
    const collection = db.collection(ASTRA_COLLECTION);
    
    // Find top 5 chunks
    const cursor = collection.find({}, {
      sort: { $vector: queryVector },
      limit: 10,
      includeSimilarity: true
    });
    
    const docs = await cursor.toArray();
    logger.info(`[QuestionGen] Retrieved ${docs.length} relevant chunks from AstraDB.`);

    // Extract text from docs
    // Depending on how vector-db stores it, usually it's in `text` or `content`
    const passages = docs.map((doc, idx) => {
      const content = doc.text || doc.content || JSON.stringify(doc);
      return `[Passage ${idx + 1} (sim: ${doc.$similarity?.toFixed(3)})]:\n${content}`;
    }).join('\n\n');

    // 4. Generate with Gemini
    const systemPrompt = `You are an expert product analyst and AI evaluation specialist for the Indian consumer market.

You have access to two sources of grounded product intelligence:
  1. The product data below (from the product database)
  2. The knowledge base context retrieved via semantic search

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT DATA (DynamoDB):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(productData, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE CONTEXT (AstraDB RAG):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${passages || 'No specific RAG context found for this query.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEARCH QUERY DRAFTED BY USER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${searchQuery}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Using the product data and knowledge base context above, generate exactly 10 high-quality evaluation questions.

CRITICAL RULE — BRAND AND PRODUCT NEUTRALITY:
   Questions must NEVER mention the brand name, product name, or model name.
   The question must read as if a real buyer is asking about their own purchase decision
   without knowing which specific product or brand will answer it.
   WRONG: "How does the BoAt Nirvana ANC compare to Sony?"
   RIGHT: "How does the noise cancellation on this compare to other options in the same price range?"
   WRONG: "What makes the Rockerz series stand out?"
   RIGHT: "What should I look for in a headphone under ₹2000 for daily commuting?"
   The product data and KB context are for YOUR internal understanding only —
   use them to determine what aspects to probe, but never surface them in the question text.

QUESTION DESIGN PRINCIPLES:

1. REAL BUYER VOICE
   Write exactly as a real Indian consumer would type into an AI assistant.
   Frame questions around the buyer's own situation, budget, and problem — not around the product.
   Examples of the right framing:
   - "I have a ₹3000 budget — what should I prioritise between battery life and sound quality?"
   - "I commute 2 hours daily on the metro, which matters more — ANC or passive isolation?"
   - "My previous headphones broke at the hinge in 8 months. How do I avoid that next time?"
   - "I use my headphones for both office calls and evening workouts — is that even practical?"

2. BUYER SITUATION FIRST
   Every question must open with a buyer context — budget, use case, pain point, lifestyle, or concern.
   The question should feel like the buyer is describing their life, not asking about a spec sheet.

3. COVER THE FULL BUYER JOURNEY
   - Budget decisions:   "I have ₹X to spend — is it worth stretching to the next price tier?"
   - Use-case fit:       "I do Y activity — will this work for me or am I better off with something else?"
   - Durability concern: "How do I know if a headphone will last more than a year?"
   - Comfort and fit:    "I wear headphones for 6+ hours a day — what should I check before buying?"
   - Trade-off:          "I have to choose between Z and W — how do I decide?"
   - Competition:        "Is spending more actually worth it, or do budget options perform just as well now?"

4. DIFFICULTY DISTRIBUTION — strict: 3 Easy, 4 Medium, 3 Hard
   Easy   — single clear answer, factual, one attribute
   Medium — requires weighing 2-3 factors, situational reasoning
   Hard   — trade-off analysis, edge cases, category-level insight, or limitation probing

5. CATEGORY COVERAGE
   All 8 categories must appear across the 10 questions:
   Features, Pricing, Use Cases, Comparisons, Limitations, Benefits, Technical, General

6. PRICE REFERENCES
   Use ₹ with realistic price brackets inferred from the product data.
   Never hardcode specific prices — express them as natural ranges
   (e.g. "around ₹2000", "under ₹5000", "in the mid-range segment").

Return ONLY a valid JSON object. No explanation, no markdown fences, no extra text.
Use this exact schema:
{
  "product_id": "${productId}",
  "product_name": "${productName}",
  "total_questions": 10,
  "questions": [
    {
      "question_number": 1,
      "question": "<buyer-situation-first question with no brand or product name>"
    }
  ]
}`;

    // Pass to Gemini wrapper
    const generatedJson = await generateJSON(systemPrompt, DEFAULT_MODEL);
    
    logger.info(`[QuestionGen] Successfully generated questions for ${productId}`);
    
    return {
      status: 'success',
      product_id: productId,
      data: generatedJson,
      _debug: {
        rag_passages_found: docs.length
      }
    };

  } catch (error) {
    logger.error(`[QuestionGen] Error generating questions: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateQuestions
};
