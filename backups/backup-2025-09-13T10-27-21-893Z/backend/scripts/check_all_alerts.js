const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const BookingAlert = require('./models/BookingAlert');
const User = require('./models/User');

async function checkAllAlerts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check all booking alerts in database
    const allAlerts = await BookingAlert.find({});
    console.log('\n=== ALL BOOKING ALERTS IN DATABASE ===');
    console.log('Total booking alerts found:', allAlerts.length);
    
    if (allAlerts.length > 0) {
      allAlerts.forEach((alert, index) => {
        console.log(`\nAlert ${index + 1}:`);
        console.log('  ID:', alert._id);
        console.log('  Title:', alert.title);
        console.log('  Status:', alert.status);
        console.log('  SendToAll:', alert.sendToAll);
        console.log('  Staff:', alert.staff);
        console.log('  CreatedBy:', alert.createdBy);
        console.log('  StartTime:', alert.startTime);
        console.log('  EndTime:', alert.endTime);
        console.log('  Created:', alert.createdAt);
      });
    } else {
      console.log('No booking alerts found in database');
    }
    
    // Check if Test Booker user exists
    const testUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (testUser) {
      console.log('\n=== TEST BOOKER USER ===');
      console.log('User ID:', testUser._id);
      console.log('Name:', testUser.firstName, testUser.lastName);
      console.log('Role:', testUser.role);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAllAlerts();