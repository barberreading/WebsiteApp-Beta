const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
require('dotenv').config();

async function checkAlertsInDB() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the Test Booker staff user
    const staffUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (!staffUser) {
      console.log('❌ Test Booker staff user not found');
      return;
    }
    
    console.log('👤 Found staff user:', staffUser.name, 'ID:', staffUser._id);
    
    // Check all booking alerts in the database
    console.log('\n🚨 ALL BOOKING ALERTS IN DATABASE:');
    const allAlerts = await BookingAlert.find({});
    console.log('Total alerts found:', allAlerts.length);
    
    allAlerts.forEach((alert, index) => {
      console.log(`\nAlert ${index + 1}:`);
      console.log('  ID:', alert._id);
      console.log('  Title:', alert.title);
      console.log('  Status:', alert.status);
      console.log('  SendToAll:', alert.sendToAll);
      console.log('  CreatedBy:', alert.createdBy);
      console.log('  Manager:', alert.manager);
      console.log('  StartTime:', alert.startTime);
      console.log('  EndTime:', alert.endTime);
      console.log('  Staff field:', alert.staff);
      console.log('  StaffId field:', alert.staffId);
    });
    
    // Check alerts that should be visible to staff
    console.log('\n🔍 ALERTS THAT SHOULD BE VISIBLE TO STAFF:');
    const staffVisibleAlerts = await BookingAlert.find({
      $or: [
        { sendToAll: true },
        { staff: staffUser._id },
        { staffId: staffUser._id },
        { createdBy: staffUser._id },
        { manager: staffUser._id }
      ]
    });
    
    console.log('Staff visible alerts count:', staffVisibleAlerts.length);
    staffVisibleAlerts.forEach((alert, index) => {
      console.log(`  Staff Alert ${index + 1}: ${alert.title} (${alert.status})`);
    });
    
    // Check all leave requests
    console.log('\n🍃 ALL LEAVE REQUESTS IN DATABASE:');
    const allLeaves = await LeaveRequest.find({});
    console.log('Total leave requests found:', allLeaves.length);
    
    allLeaves.forEach((leave, index) => {
      console.log(`\nLeave ${index + 1}:`);
      console.log('  ID:', leave._id);
      console.log('  Staff:', leave.staff);
      console.log('  StaffId:', leave.staffId);
      console.log('  StartDate:', leave.startDate);
      console.log('  EndDate:', leave.endDate);
      console.log('  Status:', leave.status);
      console.log('  LeaveType:', leave.leaveType);
    });
    
    // Check leave requests for this staff member
    console.log('\n🔍 LEAVE REQUESTS FOR THIS STAFF MEMBER:');
    const staffLeaves = await LeaveRequest.find({
      $or: [
        { staff: staffUser._id },
        { staffId: staffUser._id }
      ]
    });
    
    console.log('Staff leave requests count:', staffLeaves.length);
    staffLeaves.forEach((leave, index) => {
      console.log(`  Staff Leave ${index + 1}: ${leave.leaveType} from ${leave.startDate} to ${leave.endDate} (${leave.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\nDisconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAlertsInDB();