const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');
const xss = require('xss');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Sanitize input to prevent XSS attacks
 */
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove XSS attempts
  const sanitized = xss(value, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  // Trim whitespace
  return validator.trim(sanitized);
};

/**
 * Middleware to sanitize all request body fields
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['user', 'staff', 'manager', 'admin'])
    .withMessage('Invalid role specified'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Booking validation
 */
const validateBooking = [
  body('client')
    .trim()
    .notEmpty()
    .withMessage('Client is required')
    .isMongoId()
    .withMessage('Invalid client ID'),
  
  body('staff')
    .trim()
    .notEmpty()
    .withMessage('Staff member is required')
    .isMongoId()
    .withMessage('Invalid staff ID'),
  
  body('service')
    .trim()
    .notEmpty()
    .withMessage('Service is required')
    .isMongoId()
    .withMessage('Invalid service ID'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Invalid start time format')
    .custom((value) => {
      const startTime = new Date(value);
      if (startTime < new Date()) {
        throw new Error('Start time cannot be in the past');
      }
      return true;
    }),
  
  body('endTime')
    .isISO8601()
    .withMessage('Invalid end time format')
    .custom((value, { req }) => {
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(value);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Booking update validation (partial updates allowed)
 */
const validateBookingUpdate = [
  body('client')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid client ID'),
  
  body('staff')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid staff ID'),
  
  body('service')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid service ID'),
  
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid start time format'),
  
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid end time format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Client validation
 */
const validateClient = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.-]+$/)
    .withMessage('Name can only contain letters, spaces, dots, and hyphens'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s()-]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('address.postcode')
    .optional()
    .trim()
    .matches(/^[A-Z0-9\s-]{3,10}$/i)
    .withMessage('Please provide a valid postcode'),
  
  handleValidationErrors
];

/**
 * Service validation
 */
const validateService = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  handleValidationErrors
];

/**
 * Booking alert validation
 */
const validateBookingAlert = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Invalid start time format'),
  
  body('endTime')
    .isISO8601()
    .withMessage('Invalid end time format')
    .custom((value, { req }) => {
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(value);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('sendToAll')
    .isBoolean()
    .withMessage('sendToAll must be a boolean'),
  
  body('sendAsNotification')
    .isBoolean()
    .withMessage('sendAsNotification must be a boolean'),
  
  body('sendAsEmail')
    .isBoolean()
    .withMessage('sendAsEmail must be a boolean'),
  
  handleValidationErrors
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  sanitizeBody,
  sanitizeInput,
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateBooking,
  validateBookingUpdate,
  validateClient,
  validateService,
  validateBookingAlert,
  validatePasswordChange,
  validateObjectId,
  validatePagination
};