/**
 * Express error handling middleware
 */

const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * Must be the last middleware to catch all errors
 */
function errorHandler(err, req, res, next) {
  logger.error('ERROR_HANDLER', err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return handleMulterError(err, res);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
}

/**
 * Handle multer-specific errors
 */
function handleMulterError(err, res) {
  const errors = {
    'LIMIT_PART_COUNT': {
      statusCode: 400,
      message: 'Too many file parts'
    },
    'LIMIT_FILE_SIZE': {
      statusCode: 413,
      message: 'File size exceeds maximum limit (50MB)'
    },
    'LIMIT_FILE_COUNT': {
      statusCode: 400,
      message: 'Too many files'
    },
    'LIMIT_FIELD_KEY': {
      statusCode: 400,
      message: 'Field name too long'
    },
    'LIMIT_FIELD_VALUE': {
      statusCode: 400,
      message: 'Field value too long'
    },
    'LIMIT_FIELD_COUNT': {
      statusCode: 400,
      message: 'Too many fields'
    },
    'LIMIT_UNEXPECTED_FILE': {
      statusCode: 400,
      message: 'Unexpected file in upload'
    },
    'MISSING_FIELD_NAME': {
      statusCode: 400,
      message: 'Missing field name'
    }
  };

  const error = errors[err.code] || {
    statusCode: 400,
    message: 'File upload error'
  };

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: err.message
  });
}

/**
 * Async error wrapper for route handlers
 * Catches errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler
};
