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
    console.log('Checking leave requests in database...');
    
    // Get all leave requests
    const leaveRequests = await LeaveRequest.find().populate('staff', 'name email role');
    console.log(`Found ${leaveRequests.length} leave requests:`);
    
    leaveRequests.forEach((request, index) => {
      console.log(`${index + 1}. Staff: ${request.staff?.name || 'Unknown'} (${request.staff?.email || 'No email'})`);
      console.log(`   Dates: ${request.startDate.toDateString()} to ${request.endDate.toDateString()}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Reason: ${request.reason}`);
      console.log('---');
    });
    
    // Get all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`\nFound ${staffUsers.length} staff users:`);
    staffUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // If no leave requests exist, create a test one
    if (leaveRequests.length === 0 && staffUsers.length > 0) {
      console.log('\nNo leave requests found. Creating a test leave request...');
      
      const testLeaveRequest = new LeaveRequest({
        staff: staffUsers[0]._id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        reason: 'Test leave request for calendar debugging',
        status: 'approved'
      });
      
      await testLeaveRequest.save();
      console.log('Test leave request created successfully!');
      
      // Show the created request
      const createdRequest = await LeaveRequest.findById(testLeaveRequest._id).populate('staff', 'name email');
      console.log('Created request details:');
      console.log(`Staff: ${createdRequest.staff.name}`);
      console.log(`Dates: ${createdRequest.startDate.toDateString()} to ${createdRequest.endDate.toDateString()}`);
      console.log(`Status: ${createdRequest.status}`);
    }
    
  } catch (error) {
    console.error('Error checking leave requests:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkLeaveRequests();