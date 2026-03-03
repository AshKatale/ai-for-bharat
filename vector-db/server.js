// Vector DB Server
require('dotenv').config();
const express      = require('express');
const { PORT, NODE_ENV } = require('./config/env');
const { connectAstraDB }  = require('./config/astradb');
const corsMiddleware  = require('./middleware/corsMiddleware');
const errorHandler    = require('./middleware/errorHandler');
const vectorRoutes    = require('./routes/vectorRoutes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/vector', vectorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:   true,
    message:   'Vector DB server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectAstraDB();
    app.listen(PORT, () => {
      console.log(`🚀 Vector DB server running on http://localhost:${PORT} [${NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
