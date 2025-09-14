const cron = require('node-cron');
const { cleanupExpiredAccess } = require('./hrDocumentAccessManager');

/**
 * Initialize HR document access scheduler
 * This will run cleanup tasks at regular intervals
 */
const initializeHRDocumentScheduler = () => {
  // Run cleanup every hour to deactivate expired access records
  cron.schedule('0 * * * *', async () => {
    try {
      logger.log('Running HR document access cleanup...');
      const cleanedCount = await cleanupExpiredAccess();
      if (cleanedCount > 0) {
        logger.log(`Cleaned up ${cleanedCount} expired HR document access records`);
      }
    } catch (error) {
      logger.error('Error during HR document access cleanup:', error);
    }
  });
  
  logger.log('HR document access scheduler initialized');
};

module.exports = {
  initializeHRDocumentScheduler
};