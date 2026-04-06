/**
 * Logging utility with consistent formatting
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

function formatTimestamp() {
  return new Date().toISOString();
}

function formatLog(level, category, message, data = null) {
  const timestamp = formatTimestamp();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] [${category}] ${message}${dataStr}`;
}

const logger = {
  debug: (category, message, data) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatLog(LOG_LEVELS.DEBUG, category, message, data));
    }
  },

  info: (category, message, data) => {
    console.log(formatLog(LOG_LEVELS.INFO, category, message, data));
  },

  warn: (category, message, data) => {
    console.warn(formatLog(LOG_LEVELS.WARN, category, message, data));
  },

  error: (category, message, data) => {
    console.error(formatLog(LOG_LEVELS.ERROR, category, message, data));
  }
};

module.exports = logger;
