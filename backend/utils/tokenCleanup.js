const TokenBlacklist = require('../models/TokenBlacklist');
const cron = require('node-cron');

/**
 * Cleans up expired blacklisted tokens from the database.
 * This function should be called periodically to maintain database performance.
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await TokenBlacklist.cleanupExpiredTokens();
    console.log(`Token cleanup completed. Removed ${result.deletedCount} expired tokens.`);
    return result;
  } catch (error) {
    console.error('Token cleanup failed:', error);
    throw error;
  }
};

/**
 * Validates if a token is still valid (not expired and not blacklisted).
 * @param {string} token - The JWT token to validate.
 * @returns {Promise<boolean>} True if token is valid, false otherwise.
 */
const validateToken = async (token) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return false;
    }
    
    // Verify JWT signature and expiration
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return true;
    } catch (jwtError) {
      // Token is invalid or expired
      return false;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Starts the automatic token cleanup scheduler.
 * Runs every hour to clean up expired tokens.
 */
const startTokenCleanupScheduler = () => {
  // Run cleanup every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled token cleanup...');
    await cleanupExpiredTokens();
  });
  
  console.log('Token cleanup scheduler started (runs every hour)');
};

/**
 * Blacklists all tokens for a specific user.
 * Useful when a user's account is compromised or deactivated.
 * @param {string} userId - The user's ID.
 * @param {string} reason - Reason for blacklisting all tokens.
 */
const blacklistAllUserTokens = async (userId, reason = 'security_measure') => {
  try {
    const result = await TokenBlacklist.blacklistAllUserTokens(userId, reason);
    console.log(`Blacklisted all tokens for user ${userId}. Reason: ${reason}`);
    return result;
  } catch (error) {
    console.error('Failed to blacklist user tokens:', error);
    throw error;
  }
};

module.exports = {
  cleanupExpiredTokens,
  validateToken,
  startTokenCleanupScheduler,
  blacklistAllUserTokens
};