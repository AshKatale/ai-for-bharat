// AstraDB Vector Service
// Wraps all low-level AstraDB collection operations
const { getDB } = require('../config/astradb');

class AstraService {

  // ─── Collection Management ────────────────────────────────────────────────

  /**
   * List all collections in the keyspace.
   */
  async listCollections() {
    const db = getDB();
    const colls = await db.listCollections();
    return colls;
  }

  /**
   * Create a new collection.
   * @param {string} collectionName
   * @param {object} options  - e.g. { vector: { dimension: 1536, metric: 'cosine' } }
   */
  async createCollection(collectionName, options = {}) {
    const db = getDB();
    const collection = await db.createCollection(collectionName, options);
    return collection;
  }

  /**
   * Delete a collection.
   * @param {string} collectionName
   */
  async deleteCollection(collectionName) {
    const db = getDB();
    await db.dropCollection(collectionName);
  }

  // ─── Document Operations ──────────────────────────────────────────────────

  /**
   * Insert a single document into a collection.
   * @param {string} collectionName
   * @param {object} document  - Must include `_id` (optional) and `$vector` (optional) fields
   */
  async insertOne(collectionName, document) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(document);
    return result;
  }

  /**
   * Insert multiple documents into a collection.
   * @param {string} collectionName
   * @param {object[]} documents
   */
  async insertMany(collectionName, documents) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const result = await collection.insertMany(documents);
    return result;
  }

  /**
   * Find documents by filter.
   * @param {string} collectionName
   * @param {object} filter    - MongoDB-style filter
   * @param {object} options   - { limit, sort, projection }
   */
  async findMany(collectionName, filter = {}, options = {}) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const cursor = collection.find(filter, options);
    const docs = await cursor.toArray();
    return docs;
  }

  /**
   * Find a single document by filter.
   * @param {string} collectionName
   * @param {object} filter
   */
  async findOne(collectionName, filter = {}) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const doc = await collection.findOne(filter);
    return doc;
  }

  /**
   * Vector similarity search — find documents nearest to a query vector.
   * @param {string} collectionName
   * @param {number[]} queryVector
   * @param {number}   limit          - Number of results to return (default 10)
   * @param {object}   filter         - Optional pre-filter on metadata fields
   */
  async vectorSearch(collectionName, queryVector, limit = 10, filter = {}, includeVector = false) {
    const db = getDB();
    const collection = db.collection(collectionName);

    // Explicitly project ALL stored fields.
    // By default AstraDB excludes $vector from results; only include it when asked.
    const projection = includeVector
      ? { $vector: 1 }   // include $vector + all other fields
      : { $vector: 0 };  // exclude $vector, include everything else

    const cursor = collection.find(filter, {
      sort:       { $vector: queryVector },
      limit,
      projection,
      includeSimilarity: true,
    });
    const docs = await cursor.toArray();
    return docs;
  }

  /**
   * Update a single document.
   * @param {string} collectionName
   * @param {object} filter
   * @param {object} update  - e.g. { $set: { field: value } }
   */
  async updateOne(collectionName, filter, update) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const result = await collection.updateOne(filter, update);
    return result;
  }

  /**
   * Delete a single document.
   * @param {string} collectionName
   * @param {object} filter
   */
  async deleteOne(collectionName, filter) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const result = await collection.deleteOne(filter);
    return result;
  }

  /**
   * Delete many documents.
   * @param {string} collectionName
   * @param {object} filter
   */
  async deleteMany(collectionName, filter) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const result = await collection.deleteMany(filter);
    return result;
  }

  /**
   * Count documents matching a filter.
   * @param {string} collectionName
   * @param {object} filter
   */
  async countDocuments(collectionName, filter = {}) {
    const db = getDB();
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments(filter, { upperBound: 10000 });
    return count;
  }
}

module.exports = new AstraService();
