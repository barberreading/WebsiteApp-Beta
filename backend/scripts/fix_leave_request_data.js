const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');

async function fixLeaveRequestData() {
  try {
    logger.log('=== FIXING LEAVE REQUEST DATA ASSOCIATION ===');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.log('Connected to MongoDB');
    
    // Find the staff user
    const staffUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (!staffUser) {
      logger.error('Staff user not found!');
      return;
    }
    
    logger.log('Staff user found:');
    logger.log('- ID:', staffUser._id);
    logger.log('- Name:', staffUser.name);
    logger.log('- Email:', staffUser.email);
    logger.log('- Role:', staffUser.role);
    
    // Find all leave requests
    const leaveRequests = await LeaveRequest.find({}).populate('staff');
    logger.log('\nFound', leaveRequests.length, 'leave requests');
    
    // Check current associations
    logger.log('\nCurrent leave request associations:');
    leaveRequests.forEach((leave, index) => {
      logger.log(`Leave ${index + 1}:`);
      logger.log('- ID:', leave._id);
      logger.log('- Staff ID:', leave.staff?._id || leave.staff);
      logger.log('- Staff Name:', leave.staff?.name || 'Unknown');
      logger.log('- Start Date:', leave.startDate);
      logger.log('- Status:', leave.status);
    });
    
    // Update leave requests to belong to the correct staff user
    logger.log('\nUpdating leave requests to belong to staff user...');
    
    const updateResult = await LeaveRequest.updateMany(
      {}, // Update all leave requests
      { staff: staffUser._id }
    );
    
    logger.log('Update result:', updateResult);
    logger.log('Modified count:', updateResult.modifiedCount);
    
    // Verify the updates
    logger.log('\nVerifying updates...');
    const updatedLeaveRequests = await LeaveRequest.find({}).populate('staff');
    
    updatedLeaveRequests.forEach((leave, index) => {
      logger.log(`Updated Leave ${index + 1}:`);
      logger.log('- ID:', leave._id);
      logger.log('- Staff ID:', leave.staff?._id || leave.staff);
      logger.log('- Staff Name:', leave.staff?.name || 'Unknown');
      logger.log('- Belongs to target user:', (leave.staff?._id || leave.staff).toString() === staffUser._id.toString());
    });
    
    logger.log('\n=== LEAVE REQUEST DATA FIX COMPLETE ===');
    
  } catch (error) {
    logger.error('Error fixing leave request data:', error);
  } finally {
    await mongoose.connection.close();
    logger.log('Database connection closed');
  }
}

fixLeaveRequestData();