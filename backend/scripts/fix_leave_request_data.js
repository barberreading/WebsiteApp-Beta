const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');

async function fixLeaveRequestData() {
  try {
    console.log('=== FIXING LEAVE REQUEST DATA ASSOCIATION ===');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Find the staff user
    const staffUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (!staffUser) {
      console.error('Staff user not found!');
      return;
    }
    
    console.log('Staff user found:');
    console.log('- ID:', staffUser._id);
    console.log('- Name:', staffUser.name);
    console.log('- Email:', staffUser.email);
    console.log('- Role:', staffUser.role);
    
    // Find all leave requests
    const leaveRequests = await LeaveRequest.find({}).populate('staff');
    console.log('\nFound', leaveRequests.length, 'leave requests');
    
    // Check current associations
    console.log('\nCurrent leave request associations:');
    leaveRequests.forEach((leave, index) => {
      console.log(`Leave ${index + 1}:`);
      console.log('- ID:', leave._id);
      console.log('- Staff ID:', leave.staff?._id || leave.staff);
      console.log('- Staff Name:', leave.staff?.name || 'Unknown');
      console.log('- Start Date:', leave.startDate);
      console.log('- Status:', leave.status);
    });
    
    // Update leave requests to belong to the correct staff user
    console.log('\nUpdating leave requests to belong to staff user...');
    
    const updateResult = await LeaveRequest.updateMany(
      {}, // Update all leave requests
      { staff: staffUser._id }
    );
    
    console.log('Update result:', updateResult);
    console.log('Modified count:', updateResult.modifiedCount);
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const updatedLeaveRequests = await LeaveRequest.find({}).populate('staff');
    
    updatedLeaveRequests.forEach((leave, index) => {
      console.log(`Updated Leave ${index + 1}:`);
      console.log('- ID:', leave._id);
      console.log('- Staff ID:', leave.staff?._id || leave.staff);
      console.log('- Staff Name:', leave.staff?.name || 'Unknown');
      console.log('- Belongs to target user:', (leave.staff?._id || leave.staff).toString() === staffUser._id.toString());
    });
    
    console.log('\n=== LEAVE REQUEST DATA FIX COMPLETE ===');
    
  } catch (error) {
    console.error('Error fixing leave request data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixLeaveRequestData();