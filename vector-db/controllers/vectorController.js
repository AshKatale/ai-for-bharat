// Vector Controller
// Handles all HTTP request/response logic for vector DB operations.
const astraService     = require('../services/astraService');
const VectorDocument   = require('../models/VectorDocument');
const { getEmbedding, getEmbeddings, EMBEDDING_MODEL, EMBEDDING_DIMS } = require('../services/embeddingService');

// ─── Collection Management ─────────────────────────────────────────────────

/**
 * GET /api/vector/collections
 * List all collections.
 */
exports.listCollections = async (req, res, next) => {
  try {
    const collections = await astraService.listCollections();
    res.status(200).json({ success: true, data: collections, count: collections.length });
  } catch (err) { next(err); }
};

/**
 * POST /api/vector/collections
 * Create a new collection.
 * Body: { name, dimension?, metric? }
 * Default dimension matches the embedding model (384 for all-MiniLM-L6-v2).
 */
exports.createCollection = async (req, res, next) => {
  try {
    const { name, dimension = EMBEDDING_DIMS, metric = 'cosine' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Collection name is required.' });
    }

    const options = { vector: { dimension: Number(dimension), metric } };

    await astraService.createCollection(name, options);
    res.status(201).json({
      success: true,
      message: `Collection "${name}" created.`,
      data: { name, dimension: Number(dimension), metric, embeddingModel: EMBEDDING_MODEL },
    });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/vector/collections/:name
 * Delete a collection.
 */
exports.deleteCollection = async (req, res, next) => {
  try {
    const { name } = req.params;
    await astraService.deleteCollection(name);
    res.status(200).json({ success: true, message: `Collection "${name}" deleted.` });
  } catch (err) { next(err); }
};

// ─── Document CRUD ─────────────────────────────────────────────────────────

/**
 * POST /api/vector/:collection/documents
 * Insert one document. Auto-generates $vector from `text` if no $vector supplied.
 * Body: { text, metadata?, $vector?, embed? }
 *   embed: true  (default) → always auto-generate embedding from text
 *   embed: false           → skip embedding (store without vector)
 */
exports.insertOne = async (req, res, next) => {
  try {
    const { collection } = req.params;
    let { text, metadata, $vector, embed = true } = req.body;

    if (!text && !$vector) {
      return res.status(400).json({ success: false, message: 'At least one of "text" or "$vector" is required.' });
    }

    // Auto-generate embedding from text if no raw vector provided and embed=true
    if (!$vector && text && embed) {
      console.log('🔢 Generating embedding for document...');
      $vector = await getEmbedding(text);
    }

    const result = await VectorDocument.insertOne(collection, { text, metadata, $vector });
    res.status(201).json({ success: true, message: 'Document inserted.', data: result });
  } catch (err) { next(err); }
};

/**
 * POST /api/vector/:collection/documents/bulk
 * Insert many documents. Auto-embeds text for each doc without a $vector.
 * Body: { documents: [{ text, metadata?, $vector? }], embed? }
 */
exports.insertMany = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const { documents, embed = true } = req.body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ success: false, message: '"documents" must be a non-empty array.' });
    }

    // Auto-embed any docs that have text but no $vector
    if (embed) {
      const textsToEmbed = documents
        .map((d, i) => ({ i, text: d.text }))
        .filter(({ i, text }) => text && !documents[i].$vector);

      if (textsToEmbed.length > 0) {
        console.log(`🔢 Generating embeddings for ${textsToEmbed.length} document(s)...`);
        const vectors = await getEmbeddings(textsToEmbed.map(t => t.text));
        textsToEmbed.forEach(({ i }, vi) => {
          documents[i].$vector = vectors[vi];
        });
      }
    }

    const result = await VectorDocument.insertMany(collection, documents);
    res.status(201).json({
      success: true,
      message: `${result.insertedIds.length} document(s) inserted.`,
      data: result,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/vector/:collection/documents
 * Fetch all documents (supports ?limit and ?filter query params).
 */
exports.findMany = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const limit  = req.query.limit  ? Number(req.query.limit)  : 20;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const docs = await VectorDocument.findMany(collection, filter, { limit });
    res.status(200).json({ success: true, data: docs, count: docs.length });
  } catch (err) { next(err); }
};

/**
 * GET /api/vector/:collection/documents/:id
 * Fetch a single document by _id.
 */
exports.findById = async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    const doc = await VectorDocument.findById(collection, id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.status(200).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

/**
 * PUT /api/vector/:collection/documents/:id
 * Update a document by _id. Re-embeds text if text field is being updated.
 * Body: { text?, metadata?, embed? }
 */
exports.updateById = async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    const { embed = true, ...rest } = req.body;
    const updateData = { ...rest, updatedAt: new Date().toISOString() };

    // Re-generate embedding if text is being updated
    if (updateData.text && embed) {
      console.log('🔢 Re-generating embedding for updated text...');
      updateData.$vector = await getEmbedding(updateData.text);
    }

    const result = await VectorDocument.updateById(collection, id, updateData);
    res.status(200).json({ success: true, message: 'Document updated.', data: result });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/vector/:collection/documents/:id
 * Delete a document by _id.
 */
exports.deleteById = async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    const result = await VectorDocument.deleteById(collection, id);
    res.status(200).json({ success: true, message: 'Document deleted.', data: result });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/vector/:collection/documents
 * Delete many documents by filter.
 * Body: { filter }
 */
exports.deleteMany = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const { filter } = req.body;

    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ success: false, message: '"filter" is required to prevent accidental full-collection delete.' });
    }

    const result = await astraService.deleteMany(collection, filter);
    res.status(200).json({ success: true, message: 'Documents deleted.', data: result });
  } catch (err) { next(err); }
};

// ─── Vector Search ─────────────────────────────────────────────────────────

/**
 * POST /api/vector/:collection/search
 * Semantic similarity search.
 *
 * Accepts EITHER:
 *   { queryText: string, limit?, minSimilarity?, filter? }   ← plain text (auto-embedded)
 *   { vector: number[],  limit?, minSimilarity?, filter? }   ← raw vector (bypass embedding)
 *
 * minSimilarity filters out results below that $similarity score (0–1).
 */
exports.vectorSearch = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const { queryText, vector, limit = 10, minSimilarity = 0, filter = {} } = req.body;

    if (!queryText && (!Array.isArray(vector) || vector.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Provide either "queryText" (string) for semantic search, or "vector" (number[]) for raw vector search.',
      });
    }

    let searchVector = vector;

    // Auto-embed plain text query
    if (queryText && !searchVector) {
      console.log(`🔍 Embedding query: "${queryText}"`);
      searchVector = await getEmbedding(queryText);
      console.log(`📐 Vector generated (${searchVector.length} dims) — searching AstraDB...`);
    }

    const raw = await VectorDocument.vectorSearch(collection, searchVector, limit, filter);

    // Apply minSimilarity threshold
    const results = minSimilarity > 0
      ? raw.filter(doc => (doc.$similarity ?? 1) >= minSimilarity)
      : raw;

    res.status(200).json({
      success: true,
      query:   queryText || null,
      model:   queryText ? EMBEDDING_MODEL : null,
      data:    results,
      count:   results.length,
    });
  } catch (err) { next(err); }
};

// ─── Utilities ─────────────────────────────────────────────────────────────

/**
 * GET /api/vector/:collection/count
 * Count documents in a collection.
 */
exports.countDocuments = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const count  = await VectorDocument.count(collection, filter);
    res.status(200).json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

/**
 * GET /api/vector/embedding-info
 * Returns which model is in use and its dimension count.
 */
exports.embeddingInfo = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMS },
  });
};

/**
 * GET /api/vector/:collection/inspect
 * Fetches ONE raw document (including $vector shape) so you can see
 * exactly what fields are stored — useful for debugging external ingestion.
 */
exports.inspectDocument = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const db  = require('../config/astradb').getDB();
    const col = db.collection(collection);

    // Get one doc with ALL fields including $vector
    const doc = await col.findOne({}, { projection: { $vector: 1 } });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Collection is empty.' });
    }

    const fields = Object.keys(doc).filter(k => k !== '$vector');
    const vectorLen = doc.$vector ? doc.$vector.length : null;

    res.status(200).json({
      success:      true,
      collection,
      storedFields: fields,              // all non-vector fields
      vectorDims:   vectorLen,           // confirms dimension
      sampleDoc:    { ...doc, $vector: doc.$vector ? `[Float32Array, ${vectorLen} dims]` : null },
    });
  } catch (err) { next(err); }
};

