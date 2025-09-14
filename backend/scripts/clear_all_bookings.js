const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.log('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

async function clearAllBookings() {
  try {
    logger.log('Starting to clear all bookings...');
    
    // Get current booking count
    const currentCount = await Booking.countDocuments();
    logger.log(`Current bookings in database: ${currentCount}`);
    
    if (currentCount === 0) {
      logger.log('No bookings found to delete.');
      return;
    }
    
    // Delete all bookings
    const result = await Booking.deleteMany({});
    logger.log(`Successfully deleted ${result.deletedCount} bookings`);
    
    // Verify deletion
    const remainingCount = await Booking.countDocuments();
    logger.log(`Remaining bookings in database: ${remainingCount}`);
    
    if (remainingCount === 0) {
      logger.log('✅ All bookings have been successfully cleared!');
    } else {
      logger.log('⚠️  Some bookings may still remain in the database.');
    }
    
  } catch (error) {
    logger.error('Error clearing bookings:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    logger.log('Database connection closed.');
  }
}

// Run the function
clearAllBookings();