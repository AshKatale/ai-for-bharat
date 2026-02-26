// Logger Utility
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const log = (level, message, error = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = error
    ? `[${timestamp}] ${level}: ${message} - ${error.message}`
    : `[${timestamp}] ${level}: ${message}`;

  console.log(logMessage);

  // Optionally write to file
  // const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  // fs.appendFileSync(logFile, logMessage + '\n');
};

module.exports = {
  info: (message) => log('INFO', message),
  error: (message, error) => log('ERROR', message, error),
  warn: (message) => log('WARN', message),
  debug: (message) => log('DEBUG', message),
};
