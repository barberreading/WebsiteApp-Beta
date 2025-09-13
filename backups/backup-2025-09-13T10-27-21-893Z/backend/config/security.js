/**
 * Security Configuration
 * 
 * This file contains security configurations and middleware setup
 * for the application to protect against common vulnerabilities.
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Security Headers Configuration
 * Helmet helps secure Express apps by setting various HTTP headers
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // Referrer Policy
  referrerPolicy: {
    policy: "same-origin"
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true
});

/**
 * Rate Limiting Configuration
 * Different rate limits for different types of operations
 */
const rateLimitConfig = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: {
      error: 'Too many password reset attempts, please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // File upload endpoints
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 uploads per windowMs
    message: {
      error: 'Too many file uploads, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Create/Modify operations
  createModify: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 create/modify operations per windowMs
    message: {
      error: 'Too many create/modify operations, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }
};

/**
 * Security Best Practices Checklist:
 * 
 * ✅ Rate limiting implemented on all endpoints
 * ✅ Authentication rate limiting (5 attempts per 15 minutes)
 * ✅ Password reset rate limiting (3 attempts per hour)
 * ✅ File upload rate limiting (10 uploads per 15 minutes)
 * ✅ Create/Modify operations rate limiting (30 operations per 15 minutes)
 * ✅ Security headers with Helmet
 * ✅ Environment variables for sensitive data
 * ✅ JWT secret protection
 * ✅ Database connection string protection
 * ✅ CORS configuration
 * ✅ Input validation and sanitization
 * ✅ Protected routes with authentication middleware
 * ✅ Role-based access control
 * 
 * Additional Security Measures to Consider:
 * - Enable HTTPS in production
 * - Implement API versioning
 * - Add request logging and monitoring
 * - Implement account lockout after failed attempts
 * - Add CAPTCHA for sensitive operations
 * - Regular security audits and dependency updates
 * - Implement proper session management
 * - Add API documentation with security considerations
 */

module.exports = {
  securityHeaders,
  rateLimitConfig
};