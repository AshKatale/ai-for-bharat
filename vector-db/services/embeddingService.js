// Embedding Service
// Loads Xenova/all-MiniLM-L6-v2 once in-process (model downloads ~25MB on first run,
// then cached to disk). Produces 384-dim normalised embeddings — MATCH your
// AstraDB collection dimension to 384.
//
// To swap models, change EMBEDDING_MODEL and rebuild your collection with the
// matching dimension:
//   "Xenova/all-MiniLM-L6-v2"          → 384 dims  (fast, default)
//   "Xenova/all-mpnet-base-v2"          → 768 dims  (more accurate, slower)
//   "Xenova/paraphrase-MiniLM-L6-v2"   → 384 dims  (good for paraphrasing)

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMS  = parseInt(process.env.EMBEDDING_DIMS || '384', 10);

let _pipeline = null;  // singleton

/**
 * Load (or reuse) the embedding pipeline.
 * First call downloads the model; subsequent calls are instant.
 */
const loadPipeline = async () => {
  if (_pipeline) return _pipeline;

  // @xenova/transformers is ESM-only — use dynamic import in a CJS context
  const { pipeline } = await import('@xenova/transformers');
  console.log(`⏳ Loading embedding model: ${EMBEDDING_MODEL} (first run downloads model, cached after)...`);
  _pipeline = await pipeline('feature-extraction', EMBEDDING_MODEL);
  console.log(`✅ Embedding model ready! (${EMBEDDING_DIMS} dims)`);
  return _pipeline;
};

/**
 * Convert a plain-text string into a normalised embedding vector.
 * @param {string} text
 * @returns {Promise<number[]>} Float32Array values as a plain JS array
 */
const getEmbedding = async (text) => {
  const embed  = await loadPipeline();
  const output = await embed(text.trim(), { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

/**
 * Embed multiple strings in sequence.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
const getEmbeddings = async (texts) => {
  const embed  = await loadPipeline();
  const results = [];
  for (const text of texts) {
    const output = await embed(text.trim(), { pooling: 'mean', normalize: true });
    results.push(Array.from(output.data));
  }
  return results;
};

module.exports = { getEmbedding, getEmbeddings, EMBEDDING_MODEL, EMBEDDING_DIMS };
