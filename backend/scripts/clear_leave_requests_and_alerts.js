const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');
const BookingAlert = require('../models/BookingAlert');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.log('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

async function clearLeaveRequestsAndAlerts() {
  try {
    logger.log('Starting to clear all leave requests and booking alerts...');
    
    // Get current counts
    const leaveRequestCount = await LeaveRequest.countDocuments();
    const bookingAlertCount = await BookingAlert.countDocuments();
    
    logger.log(`Current leave requests in database: ${leaveRequestCount}`);
    logger.log(`Current booking alerts in database: ${bookingAlertCount}`);
    
    if (leaveRequestCount === 0 && bookingAlertCount === 0) {
      logger.log('No leave requests or booking alerts found to delete.');
      return;
    }
    
    // Delete all leave requests
    const leaveResult = await LeaveRequest.deleteMany({});
    logger.log(`Successfully deleted ${leaveResult.deletedCount} leave requests`);
    
    // Delete all booking alerts
    const alertResult = await BookingAlert.deleteMany({});
    logger.log(`Successfully deleted ${alertResult.deletedCount} booking alerts`);
    
    // Verify deletion
    const remainingLeaveRequests = await LeaveRequest.countDocuments();
    const remainingBookingAlerts = await BookingAlert.countDocuments();
    
    logger.log(`Remaining leave requests in database: ${remainingLeaveRequests}`);
    logger.log(`Remaining booking alerts in database: ${remainingBookingAlerts}`);
    
    if (remainingLeaveRequests === 0 && remainingBookingAlerts === 0) {
      logger.log('✅ All leave requests and booking alerts have been successfully cleared!');
    } else {
      logger.log('⚠️  Some leave requests or booking alerts may still remain in the database.');
    }
    
  } catch (error) {
    logger.error('Error clearing leave requests and booking alerts:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    logger.log('Database connection closed.');
  }
}

// Run the function
clearLeaveRequestsAndAlerts();