const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function clearAllBookings() {
  try {
    console.log('Starting to clear all bookings...');
    
    // Get current booking count
    const currentCount = await Booking.countDocuments();
    console.log(`Current bookings in database: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('No bookings found to delete.');
      return;
    }
    
    // Delete all bookings
    const result = await Booking.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} bookings`);
    
    // Verify deletion
    const remainingCount = await Booking.countDocuments();
    console.log(`Remaining bookings in database: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✅ All bookings have been successfully cleared!');
    } else {
      console.log('⚠️  Some bookings may still remain in the database.');
    }
    
  } catch (error) {
    console.error('Error clearing bookings:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the function
clearAllBookings();