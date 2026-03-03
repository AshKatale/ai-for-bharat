// File Upload Middleware
// Uses multer with in-memory storage (no temp files on disk).
const multer = require('multer');

const ALLOWED_MIME_TYPES = [
  'application/pdf',                                                           // .pdf
  'text/plain',                                                                // .txt
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
  'application/json',                                                          // .json
  'text/csv',                                                                  // .csv
];

const storage = multer.memoryStorage();  // Keep file in req.file.buffer

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Unsupported file type: ${file.mimetype}. ` +
      `Allowed types: PDF, TXT, DOCX, JSON, CSV.`
    ), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

module.exports = upload;
