const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const audioRoutes = require('./routes/audio');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const constants = require('./config/constants');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = [FRONTEND_URL, 'http://localhost:3000'];
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
}
// Allow all Vercel preview/production URLs
if (process.env.VERCEL_PROJECT_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_PROJECT_URL}`);
}

// Create required directories
const UPLOAD_DIR = constants.DIRECTORIES.UPLOADS;
const OUTPUT_DIR = constants.DIRECTORIES.OUTPUT;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info('SERVER', 'Created uploads directory', { path: UPLOAD_DIR });
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  logger.info('SERVER', 'Created output directory', { path: OUTPUT_DIR });
}

// Security Middleware
// crossOriginResourcePolicy must be 'cross-origin' because the frontend (port 3000)
// loads images and audio from the backend (port 3001) — different origins.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:3000', FRONTEND_URL],
      mediaSrc: ["'self'", 'data:', 'http://localhost:3000', FRONTEND_URL],
      connectSrc: ["'self'", 'http://localhost:3000', FRONTEND_URL]
    }
  }
}));

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed) || origin.includes('vercel.app'))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all origins in production for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
}));

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = req.get('x-request-id') || Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging Middleware
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

// Rate Limiting Configuration
const limiter = rateLimit({
  windowMs: constants.RATE_LIMIT.WINDOW_MS,
  max: constants.RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  handler: (req, res) => {
    logger.warn('RATE_LIMIT', 'Rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

app.use(limiter);

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static File Serving
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));
app.use('/output', express.static(path.join(__dirname, OUTPUT_DIR)));

logger.info('SERVER', 'Static file serving configured', {
  uploads: `/uploads -> ${UPLOAD_DIR}`,
  output: `/output -> ${OUTPUT_DIR}`
});

// Routes
app.use('/api', audioRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ai-speech-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use((req, res) => {
  logger.warn('NOT_FOUND', 'Endpoint not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  logger.info('SERVER', 'Starting AI Speech Backend API', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: FRONTEND_URL,
    uploadDir: UPLOAD_DIR,
    outputDir: OUTPUT_DIR,
    maxFileSize: `${constants.MAX_FILE_SIZE / (1024 * 1024)}MB`
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   AI Speech Processing Backend - Server Started');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Listening on: http://localhost:${PORT}`);
  console.log(`   Frontend URL: ${FRONTEND_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
});

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
  logger.info('SERVER', `Received ${signal}, starting graceful shutdown...`);

  server.close(() => {
    logger.info('SERVER', 'Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('SERVER', 'Forced shutdown after 30 second timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT_EXCEPTION', 'Uncaught exception', {
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED_REJECTION', 'Unhandled promise rejection', {
    reason: reason,
    promise: promise.toString()
  });
});

module.exports = app;
