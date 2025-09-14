const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
require('dotenv').config();

async function checkAlertsInDB() {
  try {
    logger.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('✅ Connected to MongoDB');
    
    // Find the Test Booker staff user
    const staffUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (!staffUser) {
      logger.log('❌ Test Booker staff user not found');
      return;
    }
    
    logger.log('👤 Found staff user:', staffUser.name, 'ID:', staffUser._id);
    
    // Check all booking alerts in the database
    logger.log('\n🚨 ALL BOOKING ALERTS IN DATABASE:');
    const allAlerts = await BookingAlert.find({});
    logger.log('Total alerts found:', allAlerts.length);
    
    allAlerts.forEach((alert, index) => {
      logger.log(`\nAlert ${index + 1}:`);
      logger.log('  ID:', alert._id);
      logger.log('  Title:', alert.title);
      logger.log('  Status:', alert.status);
      logger.log('  SendToAll:', alert.sendToAll);
      logger.log('  CreatedBy:', alert.createdBy);
      logger.log('  Manager:', alert.manager);
      logger.log('  StartTime:', alert.startTime);
      logger.log('  EndTime:', alert.endTime);
      logger.log('  Staff field:', alert.staff);
      logger.log('  StaffId field:', alert.staffId);
    });
    
    // Check alerts that should be visible to staff
    logger.log('\n🔍 ALERTS THAT SHOULD BE VISIBLE TO STAFF:');
    const staffVisibleAlerts = await BookingAlert.find({
      $or: [
        { sendToAll: true },
        { staff: staffUser._id },
        { staffId: staffUser._id },
        { createdBy: staffUser._id },
        { manager: staffUser._id }
      ]
    });
    
    logger.log('Staff visible alerts count:', staffVisibleAlerts.length);
    staffVisibleAlerts.forEach((alert, index) => {
      logger.log(`  Staff Alert ${index + 1}: ${alert.title} (${alert.status})`);
    });
    
    // Check all leave requests
    logger.log('\n🍃 ALL LEAVE REQUESTS IN DATABASE:');
    const allLeaves = await LeaveRequest.find({});
    logger.log('Total leave requests found:', allLeaves.length);
    
    allLeaves.forEach((leave, index) => {
      logger.log(`\nLeave ${index + 1}:`);
      logger.log('  ID:', leave._id);
      logger.log('  Staff:', leave.staff);
      logger.log('  StaffId:', leave.staffId);
      logger.log('  StartDate:', leave.startDate);
      logger.log('  EndDate:', leave.endDate);
      logger.log('  Status:', leave.status);
      logger.log('  LeaveType:', leave.leaveType);
    });
    
    // Check leave requests for this staff member
    logger.log('\n🔍 LEAVE REQUESTS FOR THIS STAFF MEMBER:');
    const staffLeaves = await LeaveRequest.find({
      $or: [
        { staff: staffUser._id },
        { staffId: staffUser._id }
      ]
    });
    
    logger.log('Staff leave requests count:', staffLeaves.length);
    staffLeaves.forEach((leave, index) => {
      logger.log(`  Staff Leave ${index + 1}: ${leave.leaveType} from ${leave.startDate} to ${leave.endDate} (${leave.status})`);
    });
    
  } catch (error) {
    logger.error('❌ Error:', error.message);
  } finally {
    logger.log('\nDisconnecting from MongoDB...');
    await mongoose.disconnect();
    logger.log('Disconnected from MongoDB');
  }
}

checkAlertsInDB();