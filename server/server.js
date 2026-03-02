// Main Server File
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { PORT, NODE_ENV } = require('./config/env');
const corsMiddleware = require('./middleware/corsMiddleware');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const { initializeAWSServices, testAWSConnectivity } = require('./services/awsServices');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/aws', require('./routes/awsRoutes'));
app.use('/api/sentiment', require('./routes/sentimentRoutes'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const awsStatus = await testAWSConnectivity();
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      awsServices: awsStatus,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      awsServices: { error: error.message },
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT} in ${NODE_ENV} mode`);

  // Initialize AWS services
  try {
    await initializeAWSServices();
  } catch (error) {
    logger.warn(`AWS services initialization encountered an issue: ${error.message}`);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
