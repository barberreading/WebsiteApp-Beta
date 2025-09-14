const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const BookingAlert = require('./models/BookingAlert');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

async function checkTestDatabaseData() {
  try {
    console.log('Checking data in TEST database...');
    
    // Connect to the test database instead of staff-management
    const testConnectionString = process.env.MONGO_URI.replace('/test?', '/test?');
    console.log('Connecting to test database:', testConnectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(testConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to TEST database successfully!');
    
    // Check users
    console.log('\n=== USERS IN TEST DATABASE ===');
    const users = await User.find({}).select('firstName lastName name email role');
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name;
      console.log(`- ${displayName} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check staff users specifically
    console.log('\n=== STAFF USERS IN TEST DATABASE ===');
    const staffUsers = await User.find({ role: 'staff' }).select('firstName lastName name email');
    console.log(`Found ${staffUsers.length} staff users:`);
    staffUsers.forEach(user => {
      const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name;
      console.log(`- ${displayName} (${user.email})`);
    });
    
    // Check bookings with staff populated
    console.log('\n=== BOOKINGS IN TEST DATABASE ===');
    const bookings = await Booking.find({}).populate('staff', 'firstName lastName name').limit(10);
    console.log(`Found ${bookings.length} bookings (showing first 10):`);
    bookings.forEach(booking => {
      let staffName = 'Unknown Staff';
      if (booking.staff) {
        staffName = booking.staff.firstName && booking.staff.lastName 
          ? `${booking.staff.firstName} ${booking.staff.lastName}` 
          : booking.staff.name || 'Unknown Staff';
      }
      console.log(`- ${booking.startTime} to ${booking.endTime} - Staff: ${staffName} - Status: ${booking.status}`);
    });
    
    // Check booking alerts
    console.log('\n=== BOOKING ALERTS IN TEST DATABASE ===');
    const alerts = await BookingAlert.find({}).limit(5);
    console.log(`Found ${alerts.length} booking alerts (showing first 5):`);
    alerts.forEach(alert => {
      console.log(`- ${alert.title} - Status: ${alert.status} - Start: ${alert.startTime}`);
    });
    
    // Check leave requests
    console.log('\n=== LEAVE REQUESTS IN TEST DATABASE ===');
    const leaveRequests = await LeaveRequest.find({}).populate('staff', 'firstName lastName name').limit(5);
    console.log(`Found ${leaveRequests.length} leave requests (showing first 5):`);
    leaveRequests.forEach(request => {
      let staffName = 'Unknown Staff';
      if (request.staff) {
        staffName = request.staff.firstName && request.staff.lastName 
          ? `${request.staff.firstName} ${request.staff.lastName}` 
          : request.staff.name || 'Unknown Staff';
      }
      console.log(`- ${request.startDate} to ${request.endDate} - Staff: ${staffName} - Status: ${request.status}`);
    });
    
    console.log('\n=== TEST DATABASE CHECK COMPLETE ===');
    console.log('\n🎯 RECOMMENDATION: Switch back to TEST database if this data looks correct!');
    
  } catch (error) {
    console.error('Test database check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

checkTestDatabaseData();