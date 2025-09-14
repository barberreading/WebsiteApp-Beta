/**
 * Production-safe logging utility for backend
 * Replaces console.log statements with configurable logging
 */

const winston = require('winston');
const path = require('path');

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isEnabled = this.isDevelopment || process.env.ENABLE_LOGGING === 'true';
    
    // Create Winston logger for production
    this.winstonLogger = winston.createLogger({
      level: this.isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(__dirname, '../logs/error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join(__dirname, '../logs/combined.log') 
        })
      ]
    });

    // Add console transport in development
    if (this.isDevelopment) {
      this.winstonLogger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  log(...args) {
    if (this.isEnabled) {
      if (this.isDevelopment) {
        logger.log(...args);
      } else {
        this.winstonLogger.info(args.join(' '));
      }
    }
  }

  warn(...args) {
    if (this.isEnabled) {
      if (this.isDevelopment) {
        logger.warn(...args);
      } else {
        this.winstonLogger.warn(args.join(' '));
      }
    }
  }

  error(...args) {
    // Always log errors, even in production
    if (this.isDevelopment) {
      logger.error(...args);
    } else {
      this.winstonLogger.error(args.join(' '));
    }
  }

  debug(...args) {
    if (this.isDevelopment) {
      logger.debug(...args);
      this.winstonLogger.debug(args.join(' '));
    }
  }

  info(...args) {
    if (this.isEnabled) {
      if (this.isDevelopment) {
        logger.info(...args);
      } else {
        this.winstonLogger.info(args.join(' '));
      }
    }
  }

  // Security-safe logging - removes sensitive data
  secureLog(message, data = {}) {
    if (!this.isEnabled) return;
    
    const sanitizedData = this.sanitizeData(data);
    this.log(message, JSON.stringify(sanitizedData));
  }

  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password', 'token', 'auth', 'secret', 'key', 'credential',
      'authorization', 'cookie', 'session', 'jwt', 'bearer', 'connectionstring'
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
module.exports = logger;

// Convenience exports
module.exports.log = logger.log.bind(logger);
module.exports.warn = logger.warn.bind(logger);
module.exports.error = logger.error.bind(logger);
module.exports.debug = logger.debug.bind(logger);
module.exports.info = logger.info.bind(logger);
module.exports.secureLog = logger.secureLog.bind(logger);