const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const BookingAlert = require('./models/BookingAlert');
const User = require('./models/User');

async function checkAllAlerts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    // Check all booking alerts in database
    const allAlerts = await BookingAlert.find({});
    logger.log('\n=== ALL BOOKING ALERTS IN DATABASE ===');
    logger.log('Total booking alerts found:', allAlerts.length);
    
    if (allAlerts.length > 0) {
      allAlerts.forEach((alert, index) => {
        logger.log(`\nAlert ${index + 1}:`);
        logger.log('  ID:', alert._id);
        logger.log('  Title:', alert.title);
        logger.log('  Status:', alert.status);
        logger.log('  SendToAll:', alert.sendToAll);
        logger.log('  Staff:', alert.staff);
        logger.log('  CreatedBy:', alert.createdBy);
        logger.log('  StartTime:', alert.startTime);
        logger.log('  EndTime:', alert.endTime);
        logger.log('  Created:', alert.createdAt);
      });
    } else {
      logger.log('No booking alerts found in database');
    }
    
    // Check if Test Booker user exists
    const testUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (testUser) {
      logger.log('\n=== TEST BOOKER USER ===');
      logger.log('User ID:', testUser._id);
      logger.log('Name:', testUser.firstName, testUser.lastName);
      logger.log('Role:', testUser.role);
    }
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    logger.log('\nDisconnected from MongoDB');
  }
}

checkAllAlerts();