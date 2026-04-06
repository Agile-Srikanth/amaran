/**
 * Application constants and configuration
 */

module.exports = {
  // Supported audio formats
  SUPPORTED_AUDIO_FORMATS: {
    mime: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4'],
    ext: ['.mp3', '.wav', '.ogg', '.flac', '.m4a']
  },

  // File size limits
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
  MIN_FILE_SIZE: 1024, // 1KB

  // Job statuses
  JOB_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // Emotion labels
  EMOTIONS: [
    'happy',
    'sad',
    'angry',
    'fearful',
    'disgusted',
    'surprised',
    'neutral'
  ],

  // Processing timeouts (in milliseconds)
  TIMEOUTS: {
    AUDIO_PROCESSING: 30000,
    EMOTION_DETECTION: 30000,
    TOTAL_PROCESSING: 120000
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 100  // raised from 20 — results page loads 2 audio + 4 images + API calls
  },

  // API response codes
  RESPONSE_CODES: {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    FILE_TOO_LARGE: 413,
    SERVER_ERROR: 500
  },

  // Directories
  DIRECTORIES: {
    UPLOADS: process.env.UPLOAD_DIR || './uploads',
    OUTPUT: process.env.OUTPUT_DIR || './output',
    LOGS: process.env.LOG_DIR || './logs'
  },

  // Python configuration
  PYTHON: {
    PATH: process.env.PYTHON_PATH || 'python3',
    TIMEOUT: 30000
  }
};
