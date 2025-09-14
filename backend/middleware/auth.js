const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const logger = require('../utils/logger');

// Protect routes
exports.protect = async function(req, res, next) {
  // Log auth middleware entry for booking alert requests
  if (req.path.includes('booking-alerts')) {
    logger.debug('\n=== AUTH MIDDLEWARE START ===');
    logger.debug('Request Path:', req.path);
    logger.debug('Request Method:', req.method);
    logger.debug('Timestamp:', new Date().toISOString());
  }
  
  // Get token from header - check both formats
  let token = req.header('x-auth-token');
  
  // Check Authorization header if x-auth-token is not present
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  
  if (req.path.includes('booking-alerts')) {
    logger.debug('Token found:', !!token);
    logger.debug('Token length:', token ? token.length : 0);
    logger.secureLog('Token preview:', { hasToken: !!token });
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // First check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ msg: 'Token has been revoked' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired (additional validation)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    
    if (req.path.includes('booking-alerts')) {
      logger.debug('Token decoded successfully');
      logger.secureLog('Decoded payload:', { userId: decoded.user?.id || decoded.id, exp: decoded.exp });
    }

    // Add user from payload
    if (decoded.id) {
      req.user = await User.findById(decoded.id);
    } else if (decoded.user && decoded.user.id) {
      req.user = await User.findById(decoded.user.id);
    }
    
    if (req.path.includes('booking-alerts')) {
      logger.debug('User lookup result:', !!req.user);
      if (req.user) {
        logger.secureLog('User found:', { userId: req.user.id, email: req.user.email, role: req.user.role });
      }
    }
    
    // If user not found but token is valid, create temporary user object
    if (!req.user && (decoded.id || (decoded.user && decoded.user.id))) {
      req.user = {
        id: decoded.id || decoded.user.id,
        role: decoded.role || decoded.user.role || 'user'
      };
      
      if (req.path.includes('booking-alerts')) {
        logger.debug('Created temporary user object:', req.user);
      }
    }
    
    if (req.path.includes('booking-alerts')) {
      logger.debug('=== AUTH MIDDLEWARE SUCCESS ===\n');
    }
    
    next();
  } catch (err) {
    logger.warn('Token validation error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Authorize certain roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's passed as a single array argument
    const flatRoles = roles.flat();
    
    // Debug logging can be enabled here if needed
    // if (req.path.includes('booking-alerts') || req.path.includes('email-templates')) {
    //   logger.log('=== AUTHORIZE MIDDLEWARE START ===');
    //   logger.log('Request path:', req.path);
    //   logger.log('Original roles:', roles);
    //   logger.log('Flattened roles:', flatRoles);
    //   logger.log('User object:', req.user);
    //   logger.log('User role:', req.user?.role);
    // }
    
    if (!req.user) {
      logger.error('No user object in authorize middleware');
      return res.status(401).json({ msg: 'Authentication required' });
    }
    
    if (!flatRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

exports.role = exports.authorize;

exports.admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superuser')) {
    next();
  } else {
    res.status(403).json({ msg: 'Administrator access required.' });
  }
};

// Alias for authorize function
exports.role = exports.authorize;

// Additional alias for checkRole (used in some routes)
exports.checkRole = exports.authorize;