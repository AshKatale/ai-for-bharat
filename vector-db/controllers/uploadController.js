// File Upload Controller
const { parseFile, chunkText } = require('../services/fileParserService');
const { getEmbeddings }       = require('../services/embeddingService');
const VectorDocument          = require('../models/VectorDocument');

/**
 * POST /api/vector/:collection/upload
 * Upload a file (PDF, TXT, DOCX, JSON, CSV), extract its text,
 * optionally chunk it, and store each chunk as a document in AstraDB.
 *
 * Form fields:
 *   file           (required) — the file to upload
 *   metadata       (optional) — JSON string of extra metadata to attach to every chunk
 *   chunkSize      (optional) — characters per chunk (default: 1000, set 0 to disable chunking)
 *   overlap        (optional) — overlap chars between chunks (default: 100)
 *   embed          (optional) — auto-generate embedding vector for each chunk (default: true)
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { collection } = req.params;

    // multer puts the file on req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Use multipart/form-data with field name "file".' });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    // Parse optional form fields
    let metadata = {};
    if (req.body.metadata) {
      try { metadata = JSON.parse(req.body.metadata); }
      catch { return res.status(400).json({ success: false, message: '"metadata" must be valid JSON.' }); }
    }

    const chunkSize = req.body.chunkSize !== undefined ? Number(req.body.chunkSize) : 1000;
    const overlap   = req.body.overlap   !== undefined ? Number(req.body.overlap)   : 100;
    const embed     = req.body.embed !== 'false' && req.body.embed !== false;  // default true

    // ── Extract text ────────────────────────────────────────────────────
    let extractedText;
    try {
      extractedText = await parseFile(buffer, mimetype, originalname);
    } catch (parseErr) {
      return res.status(422).json({ success: false, message: `Failed to parse file: ${parseErr.message}` });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({ success: false, message: 'File parsed successfully but no text content was found.' });
    }

    // ── Chunk or store as single document ───────────────────────────────
    const baseMetadata = {
      ...metadata,
      source_filename: originalname,
      source_mimetype: mimetype,
      source_size_bytes: size,
      uploaded_at: new Date().toISOString(),
    };

    let result;

    if (chunkSize === 0) {
      // Store as a single document (no chunking)
      let $vector;
      if (embed) {
        console.log('🔢 Generating embedding for document...');
        const { getEmbedding } = require('../services/embeddingService');
        $vector = await getEmbedding(extractedText);
      }

      result = await VectorDocument.insertOne(collection, {
        text: extractedText,
        metadata: { ...baseMetadata, chunk_index: 0, total_chunks: 1 },
        $vector,
      });

      return res.status(201).json({
        success: true,
        message: `File "${originalname}" stored as 1 document${embed ? ' with embedding' : ''}.`,
        data: {
          filename:      originalname,
          characters:    extractedText.length,
          chunks_stored: 1,
          embedded:      embed,
          insertedId:    result.insertedId,
        },
      });
    }

    // Chunk the text
    const chunks = chunkText(extractedText, chunkSize, overlap);
    let documents = chunks.map((chunk, idx) => ({
      text: chunk,
      metadata: {
        ...baseMetadata,
        chunk_index:  idx,
        total_chunks: chunks.length,
      },
    }));

    // Auto-embed all chunks
    if (embed) {
      console.log(`🔢 Generating embeddings for ${chunks.length} chunk(s)...`);
      const vectors = await getEmbeddings(chunks);
      documents = documents.map((doc, i) => ({ ...doc, $vector: vectors[i] }));
    }

    result = await VectorDocument.insertMany(collection, documents);

    return res.status(201).json({
      success: true,
      message: `File "${originalname}" split into ${chunks.length} chunk(s) and stored${embed ? ' with embeddings' : ''}.`,
      data: {
        filename:      originalname,
        characters:    extractedText.length,
        chunks_stored: chunks.length,
        embedded:      embed,
        insertedIds:   result.insertedIds,
      },
    });

  } catch (err) { next(err); }
};
