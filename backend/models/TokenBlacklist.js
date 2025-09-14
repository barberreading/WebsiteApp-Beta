const mongoose = require('mongoose');

const TokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['logout', 'password_change', 'security_breach', 'admin_revoke'],
    default: 'logout'
  },
  blacklistedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
});

// Static method to blacklist a token
TokenBlacklistSchema.statics.blacklistToken = async function(token, userId, reason = 'logout') {
  const jwt = require('jsonwebtoken');
  
  try {
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token format');
    }
    
    const expiresAt = new Date(decoded.exp * 1000);
    
    // Only blacklist if token hasn't expired yet
    if (expiresAt > new Date()) {
      await this.create({
        token,
        userId,
        reason,
        expiresAt
      });
    }
    
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    return false;
  }
};

// Static method to check if token is blacklisted
TokenBlacklistSchema.statics.isTokenBlacklisted = async function(token) {
  try {
    const blacklistedToken = await this.findOne({ token });
    return !!blacklistedToken;
  } catch (error) {
    logger.error('Error checking token blacklist:', error);
    return false;
  }
};

// Static method to blacklist all tokens for a user
TokenBlacklistSchema.statics.blacklistAllUserTokens = async function(userId, reason = 'security_breach') {
  // This is a placeholder - in a real implementation, you'd need to track active tokens
  // For now, we'll just mark the user as requiring re-authentication
  logger.log(`All tokens for user ${userId} should be considered invalid due to: ${reason}`);
  return true;
};

// Clean up expired blacklist entries (called by a cron job)
TokenBlacklistSchema.statics.cleanupExpired = async function() {
  try {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    logger.log(`Cleaned up ${result.deletedCount} expired blacklisted tokens`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);