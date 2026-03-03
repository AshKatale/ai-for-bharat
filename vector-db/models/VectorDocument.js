// VectorDocument Model
// Provides structured helper methods on top of AstraService
// for the default "documents" collection.
const { v4: uuidv4 } = require('uuid');
const astraService = require('../services/astraService');

const DEFAULT_COLLECTION = 'documents';

class VectorDocument {

  /**
   * Build a standardised document object ready for AstraDB insertion.
   * @param {object} data
   * @param {number[]} [data.$vector]   - Embedding vector (if any)
   * @param {object}   [data.metadata]  - Arbitrary key-value metadata
   * @param {string}   [data.text]      - Source text content
   * @param {string}   [data._id]       - Override auto-generated ID
   */
  static build({ text = '', metadata = {}, $vector, _id } = {}) {
    return {
      _id:       _id || uuidv4(),
      text,
      metadata,
      createdAt: new Date().toISOString(),
      ...($vector ? { $vector } : {}),
    };
  }

  /**
   * Insert one document into the given collection.
   */
  static async insertOne(collectionName = DEFAULT_COLLECTION, data) {
    const doc = VectorDocument.build(data);
    const result = await astraService.insertOne(collectionName, doc);
    return { insertedId: result.insertedId, document: doc };
  }

  /**
   * Insert many documents.
   */
  static async insertMany(collectionName = DEFAULT_COLLECTION, dataArray) {
    const docs = dataArray.map(d => VectorDocument.build(d));
    const result = await astraService.insertMany(collectionName, docs);
    return { insertedIds: result.insertedIds, documents: docs };
  }

  /**
   * Fetch all documents (with optional filter + limit).
   */
  static async findMany(collectionName = DEFAULT_COLLECTION, filter = {}, options = {}) {
    return astraService.findMany(collectionName, filter, options);
  }

  /**
   * Fetch one document by _id.
   */
  static async findById(collectionName = DEFAULT_COLLECTION, id) {
    return astraService.findOne(collectionName, { _id: id });
  }

  /**
   * Vector similarity search.
   */
  static async vectorSearch(collectionName = DEFAULT_COLLECTION, queryVector, limit = 10, filter = {}) {
    return astraService.vectorSearch(collectionName, queryVector, limit, filter);
  }

  /**
   * Update a document by _id.
   */
  static async updateById(collectionName = DEFAULT_COLLECTION, id, updateData) {
    return astraService.updateOne(collectionName, { _id: id }, { $set: updateData });
  }

  /**
   * Delete a document by _id.
   */
  static async deleteById(collectionName = DEFAULT_COLLECTION, id) {
    return astraService.deleteOne(collectionName, { _id: id });
  }

  /**
   * Count documents.
   */
  static async count(collectionName = DEFAULT_COLLECTION, filter = {}) {
    return astraService.countDocuments(collectionName, filter);
  }
}

module.exports = VectorDocument;
