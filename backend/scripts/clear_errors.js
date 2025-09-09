const mongoose = require('mongoose');
const ErrorLog = require('./models/ErrorLog');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected...');
    
    try {
      // Delete all error logs
      const result = await ErrorLog.deleteMany({});
      console.log(`Successfully deleted ${result.deletedCount} error logs`);
    } catch (err) {
      console.error('Error deleting error logs:', err);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });