const mongoose = require('mongoose');
const ErrorLog = require('./models/ErrorLog');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.log('MongoDB Connected...');
    
    try {
      // Delete all error logs
      const result = await ErrorLog.deleteMany({});
      logger.log(`Successfully deleted ${result.deletedCount} error logs`);
    } catch (err) {
      logger.error('Error deleting error logs:', err);
    } finally {
      // Close the connection
      mongoose.connection.close();
      logger.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });