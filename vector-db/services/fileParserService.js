// File Parser Service
// Extracts plain text from uploaded file buffers based on MIME type.
const PDFParser = require('pdf2json');
const mammoth   = require('mammoth');

/**
 * Extract text from a PDF buffer using pdf2json (pure Node.js, no native deps).
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
const parsePdf = (buffer) => {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1); // 1 = raw text mode

    parser.on('pdfParser_dataError', (err) => {
      reject(new Error(err.parserError || 'PDF parsing failed'));
    });

    parser.on('pdfParser_dataReady', () => {
      // getRawTextContent() returns the full text with page breaks
      const raw = parser.getRawTextContent();
      resolve(raw.trim());
    });

    parser.parseBuffer(buffer);
  });
};

/**
 * Parse an uploaded file buffer into plain text.
 * @param {Buffer} buffer       - File buffer from multer
 * @param {string} mimetype     - MIME type of the file
 * @returns {Promise<string>}   - Extracted text content
 */
const parseFile = async (buffer, mimetype) => {
  switch (mimetype) {

    // ── PDF ───────────────────────────────────────────────────────────────
    case 'application/pdf':
      return parsePdf(buffer);

    // ── DOCX ──────────────────────────────────────────────────────────────
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    // ── Plain Text ────────────────────────────────────────────────────────
    case 'text/plain':
      return buffer.toString('utf-8').trim();

    // ── CSV ───────────────────────────────────────────────────────────────
    case 'text/csv':
      return buffer.toString('utf-8').trim();

    // ── JSON ──────────────────────────────────────────────────────────────
    case 'application/json': {
      const parsed = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(parsed, null, 2);
    }

    default:
      throw new Error(`Unsupported file type: ${mimetype}`);
  }
};

/**
 * Split text into chunks of roughly `chunkSize` characters,
 * respecting sentence boundaries where possible.
 * @param {string} text
 * @param {number} chunkSize  - Target chars per chunk (default 1000)
 * @param {number} overlap    - Chars of overlap between chunks (default 100)
 */
const chunkText = (text, chunkSize = 1000, overlap = 100) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a sentence boundary within the last 200 chars of the window
    if (end < text.length) {
      const window = text.slice(end - 200, end);
      const lastBreak = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf('\n'),
      );
      if (lastBreak > 0) {
        end = end - 200 + lastBreak + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter(c => c.length > 0);
};

module.exports = { parseFile, chunkText };
