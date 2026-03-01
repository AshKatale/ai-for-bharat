// AWS SDK Configuration
const AWS = require('aws-sdk');
const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  NODE_ENV,
} = require('./env');

// Configure AWS SDK
AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

// Configure for local development if needed
if (NODE_ENV === 'development' && process.env.USE_LOCAL_AWS === 'true') {
  AWS.config.update({
    endpoint: 'http://localhost:8000', // LocalStack or DynamoDB Local endpoint
  });
}

module.exports = AWS;
