/**
 * Production-safe logging utility
 * Replaces console.log statements with configurable logging
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isEnabled = this.isDevelopment || process.env.REACT_APP_ENABLE_LOGGING === 'true';
  }

  log(...args) {
    if (this.isEnabled) {
      logger.log(...args);
    }
  }

  warn(...args) {
    if (this.isEnabled) {
      logger.warn(...args);
    }
  }

  error(...args) {
    // Always log errors, even in production
    logger.error(...args);
  }

  debug(...args) {
    if (this.isDevelopment) {
      logger.debug(...args);
    }
  }

  info(...args) {
    if (this.isEnabled) {
      logger.info(...args);
    }
  }

  // Security-safe logging - removes sensitive data
  secureLog(message, data = {}) {
    if (!this.isEnabled) return;
    
    const sanitizedData = this.sanitizeData(data);
    logger.log(message, sanitizedData);
  }

  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password', 'token', 'auth', 'secret', 'key', 'credential',
      'authorization', 'cookie', 'session', 'jwt', 'bearer'
    ];

    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }
}

const logger = new Logger();
export default logger;

// Convenience exports
export const { log, warn, error, debug, info, secureLog } = logger;