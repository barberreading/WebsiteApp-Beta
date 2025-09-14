/**
 * Security headers middleware
 * Implements CSP, HSTS, X-Frame-Options and other security headers
 */

const logger = require('../utils/logger');

class SecurityHeaders {
  static getContentSecurityPolicy() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Base CSP policy
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'", // Required for React development
        'https://cdn.jsdelivr.net',
        'https://unpkg.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      'connect-src': [
        "'self'",
        'https://api.fontawesome.com'
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'worker-src': ["'self'", 'blob:']
    };

    // In development, allow localhost connections
    if (!isProduction) {
      cspDirectives['connect-src'].push(
        'http://localhost:*',
        'ws://localhost:*',
        'wss://localhost:*'
      );
    }

    // Convert to CSP string
    return Object.entries(cspDirectives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  static getSecurityHeaders() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      // Content Security Policy
      'Content-Security-Policy': this.getContentSecurityPolicy(),
      
      // HTTP Strict Transport Security (HSTS)
      ...(isProduction && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      }),
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()'
      ].join(', '),
      
      // Remove server information
      'Server': '',
      'X-Powered-By': ''
    };
  }
}

// Security headers middleware
const securityHeadersMiddleware = (req, res, next) => {
  try {
    const headers = SecurityHeaders.getSecurityHeaders();
    
    // Apply all security headers
    Object.entries(headers).forEach(([header, value]) => {
      if (value) {
        res.setHeader(header, value);
      } else {
        res.removeHeader(header);
      }
    });

    // Log CSP violations in production
    if (process.env.NODE_ENV === 'production' && req.body && req.body['csp-report']) {
      logger.warn('CSP Violation Report:', {
        report: req.body['csp-report'],
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    logger.error('Error applying security headers:', error);
    next();
  }
};

// CORS configuration middleware
const corsMiddleware = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Define allowed origins
  const allowedOrigins = isProduction 
    ? [
        process.env.FRONTEND_URL || 'https://yourdomain.com',
        process.env.ADMIN_URL || 'https://admin.yourdomain.com'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ];

  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || !isProduction) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ].join(', '));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

// Rate limiting helper
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) {
        requests.delete(ip);
      }
    }
    
    // Get or create request data
    let requestData = requests.get(key);
    if (!requestData || now - requestData.resetTime > windowMs) {
      requestData = {
        count: 0,
        resetTime: now
      };
      requests.set(key, requestData);
    }
    
    requestData.count++;
    
    // Check if limit exceeded
    if (requestData.count > max) {
      logger.warn('Rate limit exceeded:', {
        ip: key,
        count: requestData.count,
        limit: max,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests',
          type: 'rate_limit',
          retryAfter: Math.ceil((windowMs - (now - requestData.resetTime)) / 1000)
        }
      });
      return;
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestData.count));
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + windowMs).toISOString());
    
    next();
  };
};

module.exports = {
  SecurityHeaders,
  securityHeadersMiddleware,
  corsMiddleware,
  createRateLimiter
};