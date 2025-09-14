const mongoose = require('mongoose');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkLeaveRequests() {
  try {
    logger.log('Checking leave requests in database...');
    
    // Get all leave requests
    const leaveRequests = await LeaveRequest.find().populate('staff', 'name email role');
    logger.log(`Found ${leaveRequests.length} leave requests:`);
    
    leaveRequests.forEach((request, index) => {
      logger.log(`${index + 1}. Staff: ${request.staff?.name || 'Unknown'} (${request.staff?.email || 'No email'})`);
      logger.log(`   Dates: ${request.startDate.toDateString()} to ${request.endDate.toDateString()}`);
      logger.log(`   Status: ${request.status}`);
      logger.log(`   Reason: ${request.reason}`);
      logger.log('---');
    });
    
    // Get all staff users
    const staffUsers = await User.find({ role: 'staff' });
    logger.log(`\nFound ${staffUsers.length} staff users:`);
    staffUsers.forEach((user, index) => {
      logger.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // If no leave requests exist, create a test one
    if (leaveRequests.length === 0 && staffUsers.length > 0) {
      logger.log('\nNo leave requests found. Creating a test leave request...');
      
      const testLeaveRequest = new LeaveRequest({
        staff: staffUsers[0]._id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        reason: 'Test leave request for calendar debugging',
        status: 'approved'
      });
      
      await testLeaveRequest.save();
      logger.log('Test leave request created successfully!');
      
      // Show the created request
      const createdRequest = await LeaveRequest.findById(testLeaveRequest._id).populate('staff', 'name email');
      logger.log('Created request details:');
      logger.log(`Staff: ${createdRequest.staff.name}`);
      logger.log(`Dates: ${createdRequest.startDate.toDateString()} to ${createdRequest.endDate.toDateString()}`);
      logger.log(`Status: ${createdRequest.status}`);
    }
    
  } catch (error) {
    logger.error('Error checking leave requests:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkLeaveRequests();