const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async function(req, res, next) {
  // Log auth middleware entry for booking alert requests
  if (req.path.includes('booking-alerts')) {
    console.log('\n=== AUTH MIDDLEWARE START ===');
    console.log('Request Path:', req.path);
    console.log('Request Method:', req.method);
    console.log('Timestamp:', new Date().toISOString());
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
    console.log('Token found:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (req.path.includes('booking-alerts')) {
      console.log('Token decoded successfully');
      console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
    }

    // Add user from payload
    if (decoded.id) {
      req.user = await User.findById(decoded.id);
    } else if (decoded.user && decoded.user.id) {
      req.user = await User.findById(decoded.user.id);
    }
    
    if (req.path.includes('booking-alerts')) {
      console.log('User lookup result:', !!req.user);
      if (req.user) {
        console.log('User ID:', req.user.id);
        console.log('User Email:', req.user.email);
        console.log('User Role:', req.user.role);
      }
    }
    
    // If user not found but token is valid, create temporary user object
    if (!req.user && (decoded.id || (decoded.user && decoded.user.id))) {
      req.user = {
        id: decoded.id || decoded.user.id,
        role: decoded.role || decoded.user.role || 'user'
      };
      
      if (req.path.includes('booking-alerts')) {
        console.log('Created temporary user object:', req.user);
      }
    }
    
    if (req.path.includes('booking-alerts')) {
      console.log('=== AUTH MIDDLEWARE SUCCESS ===\n');
    }
    
    next();
  } catch (err) {
    console.error('Token validation error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Authorize certain roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.path.includes('booking-alerts')) {
      console.log('=== AUTHORIZE MIDDLEWARE START ===');
      console.log('Required roles:', roles);
      console.log('User object:', req.user);
      console.log('User role:', req.user?.role);
    }
    
    if (!req.user) {
      console.error('No user object in authorize middleware');
      return res.status(401).json({ msg: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.error(`Role ${req.user.role} not in allowed roles:`, roles);
      return res.status(403).json({ 
        msg: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    if (req.path.includes('booking-alerts')) {
      console.log('=== AUTHORIZE MIDDLEWARE SUCCESS ===');
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