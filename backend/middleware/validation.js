/**
 * Input validation middleware
 */

const constants = require('../config/constants');

/**
 * Validate file upload
 */
function validateAudioFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No audio file provided',
      required: ['audio file in multipart form-data']
    });
  }

  // Check file size
  if (req.file.size > constants.MAX_FILE_SIZE) {
    return res.status(413).json({
      success: false,
      message: `File size exceeds maximum limit (${constants.MAX_FILE_SIZE / (1024 * 1024)}MB)`,
      fileSize: req.file.size
    });
  }

  if (req.file.size < constants.MIN_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      message: `File size is too small (minimum ${constants.MIN_FILE_SIZE} bytes)`
    });
  }

  // Validation passed
  next();
}

/**
 * Validate job ID format
 */
function validateJobId(req, res, next) {
  const { jobId } = req.params;

  // UUID v4 regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(jobId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job ID format'
    });
  }

  next();
}

/**
 * Validate query parameters
 */
function validateQueryParams(allowedParams) {
  return (req, res, next) => {
    const invalidParams = Object.keys(req.query).filter(
      param => !allowedParams.includes(param)
    );

    if (invalidParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        invalid: invalidParams,
        allowed: allowedParams
      });
    }

    next();
  };
}

module.exports = {
  validateAudioFile,
  validateJobId,
  validateQueryParams
};
