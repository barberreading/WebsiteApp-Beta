/**
 * Input validation and sanitization middleware
 * Protects against injection attacks and validates data formats
 */

const logger = require('../utils/logger');

// Dangerous patterns to detect and block
const DANGEROUS_PATTERNS = [
  // SQL Injection patterns
  /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
  /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
  
  // NoSQL Injection patterns
  /\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex/i,
  
  // XSS patterns
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/i,
  /on\w+\s*=/i,
  
  // Command injection patterns
  /[;&|`$(){}\[\]]/,
  /(rm|del|format|shutdown|reboot|kill)/i,
  
  // Path traversal patterns
  /\.\.[\/\\]/,
  /[\/\\]\.\.[\/\\]/,
  
  // LDAP injection patterns
  /[()=*!&|]/
];

// File upload dangerous extensions
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
  '.jar', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
  '.sh', '.bash', '.ps1', '.msi', '.deb', '.rpm'
];

// Maximum sizes for different input types
const SIZE_LIMITS = {
  text: 10000,        // 10KB for text fields
  email: 254,         // RFC standard
  password: 128,      // Reasonable password length
  name: 100,          // Name fields
  description: 5000,  // Description fields
  url: 2048,          // URL length limit
  phone: 20,          // Phone number
  file: 10 * 1024 * 1024, // 10MB for files
  json: 1024 * 1024   // 1MB for JSON payloads
};

class InputValidator {
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // Normalize unicode
    sanitized = sanitized.normalize('NFC');
    
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  static detectDangerousPatterns(input) {
    if (typeof input !== 'string') {
      return false;
    }

    return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
  }

  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= SIZE_LIMITS.email;
  }

  static validatePassword(password) {
    if (typeof password !== 'string') {
      return { valid: false, message: 'Password must be a string' };
    }

    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    if (password.length > SIZE_LIMITS.password) {
      return { valid: false, message: 'Password is too long' };
    }

    // Check for at least one uppercase, lowercase, number, and special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return {
        valid: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
      };
    }

    return { valid: true };
  }

  static validatePhone(phone) {
    if (typeof phone !== 'string') {
      return false;
    }

    // Remove all non-digit characters for validation
    const digits = phone.replace(/\D/g, '');
    
    // Check if it's a reasonable phone number length
    return digits.length >= 10 && digits.length <= 15 && phone.length <= SIZE_LIMITS.phone;
  }

  static validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol) && url.length <= SIZE_LIMITS.url;
    } catch {
      return false;
    }
  }

  static validateFileUpload(file) {
    const errors = [];

    // Check file size
    if (file.size > SIZE_LIMITS.file) {
      errors.push('File size exceeds limit');
    }

    // Check file extension
    const extension = '.' + file.originalname.split('.').pop().toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push('File type not allowed');
    }

    // Check filename for dangerous patterns
    if (this.detectDangerousPatterns(file.originalname)) {
      errors.push('Filename contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static sanitizeObject(obj, maxDepth = 5) {
    if (maxDepth <= 0) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? this.sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    const sanitized = {};
    Object.keys(obj).forEach(key => {
      const sanitizedKey = this.sanitizeString(key);
      sanitized[sanitizedKey] = this.sanitizeObject(obj[key], maxDepth - 1);
    });

    return sanitized;
  }

  static validateRequestSize(req) {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    // Different limits based on content type
    if (req.is('application/json')) {
      return contentLength <= SIZE_LIMITS.json;
    }
    
    if (req.is('multipart/form-data')) {
      return contentLength <= SIZE_LIMITS.file;
    }
    
    // Default text limit
    return contentLength <= SIZE_LIMITS.text;
  }
}

// Input validation middleware
const inputValidationMiddleware = (req, res, next) => {
  try {
    // Check request size
    if (!InputValidator.validateRequestSize(req)) {
      logger.warn('Request size exceeded:', {
        contentLength: req.get('content-length'),
        ip: req.ip,
        url: req.url
      });
      
      return res.status(413).json({
        success: false,
        error: {
          message: 'Request entity too large',
          type: 'validation'
        }
      });
    }

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = InputValidator.sanitizeObject(req.body);
      
      // Check for dangerous patterns in body
      const bodyString = JSON.stringify(req.body);
      if (InputValidator.detectDangerousPatterns(bodyString)) {
        logger.warn('Dangerous pattern detected in request body:', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid input detected',
            type: 'validation'
          }
        });
      }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = InputValidator.sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = InputValidator.sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Input validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Validation error',
        type: 'server'
      }
    });
  }
};

// Specific validation functions for common fields
const validateRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
  const errors = [];

  // Validate email
  if (!email || !InputValidator.validateEmail(email)) {
    errors.push('Valid email is required');
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = InputValidator.validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
    }
  }

  // Validate names
  if (!firstName || firstName.length > SIZE_LIMITS.name) {
    errors.push('Valid first name is required');
  }
  
  if (!lastName || lastName.length > SIZE_LIMITS.name) {
    errors.push('Valid last name is required');
  }

  // Validate phone if provided
  if (phone && !InputValidator.validatePhone(phone)) {
    errors.push('Valid phone number is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        type: 'validation',
        details: errors
      }
    });
  }

  next();
};

module.exports = {
  InputValidator,
  inputValidationMiddleware,
  validateRegistration,
  SIZE_LIMITS,
  DANGEROUS_PATTERNS
};