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
    const systemPrompt = `You are an expert in consumer search behavior and Generative Engine Optimization (GEO).
Your task is to generate realistic questions that consumers might ask AI assistants such as ChatGPT, Gemini, Perplexity, or Claude when researching products.

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

CRITICAL RULES

1. Questions must sound exactly like real consumer queries asked to AI assistants.
2. Questions must represent real buying intent or product research intent.
3. Include both generic category questions and brand-specific questions.
4. Include comparisons between the brand and competitors when relevant.
5. Avoid duplicate or very similar questions.
6. Questions should be between 8 and 20 words.
7. Do NOT use technical or marketing language.
8. Questions must focus on real decision-making scenarios consumers face.
9. Some questions must mention the brand "{brand_name}" directly.
10. Do NOT include explanations or commentary in the response.

--------------------------------------------------

QUESTION DESIGN PRINCIPLES

Ensure the questions cover the following consumer intent categories:

1. Best Product Discovery
   Example: "What are the best wireless headphones under ₹5000?"

2. Brand Comparison
   Example: "Is {brand_name} better than {competitors} for daily use?"

3. Feature-Based Evaluation
   Example: "Which headphones have the best battery life and comfort?"

4. Use-Case Driven Questions
   Example: "Which headphones are best for long work-from-home calls?"

5. Budget & Value Queries
   Example: "What affordable headphones offer good sound quality?"

6. Brand Trust / Reputation
   Example: "Is {brand_name} a reliable brand for wireless headphones?"

7. Problem Solving
   Example: "Which headphones are comfortable for long listening sessions?"

8. Purchase Decision Queries
   Example: "Should I buy {brand_name} headphones or Sony for better sound?"

Ensure the final list contains a balanced mix of these intent types.

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
