const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');
const BookingAlert = require('../models/BookingAlert');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function clearLeaveRequestsAndAlerts() {
  try {
    console.log('Starting to clear all leave requests and booking alerts...');
    
    // Get current counts
    const leaveRequestCount = await LeaveRequest.countDocuments();
    const bookingAlertCount = await BookingAlert.countDocuments();
    
    console.log(`Current leave requests in database: ${leaveRequestCount}`);
    console.log(`Current booking alerts in database: ${bookingAlertCount}`);
    
    if (leaveRequestCount === 0 && bookingAlertCount === 0) {
      console.log('No leave requests or booking alerts found to delete.');
      return;
    }
    
    // Delete all leave requests
    const leaveResult = await LeaveRequest.deleteMany({});
    console.log(`Successfully deleted ${leaveResult.deletedCount} leave requests`);
    
    // Delete all booking alerts
    const alertResult = await BookingAlert.deleteMany({});
    console.log(`Successfully deleted ${alertResult.deletedCount} booking alerts`);
    
    // Verify deletion
    const remainingLeaveRequests = await LeaveRequest.countDocuments();
    const remainingBookingAlerts = await BookingAlert.countDocuments();
    
    console.log(`Remaining leave requests in database: ${remainingLeaveRequests}`);
    console.log(`Remaining booking alerts in database: ${remainingBookingAlerts}`);
    
    if (remainingLeaveRequests === 0 && remainingBookingAlerts === 0) {
      console.log('✅ All leave requests and booking alerts have been successfully cleared!');
    } else {
      console.log('⚠️  Some leave requests or booking alerts may still remain in the database.');
    }
    
  } catch (error) {
    console.error('Error clearing leave requests and booking alerts:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the function
clearLeaveRequestsAndAlerts();