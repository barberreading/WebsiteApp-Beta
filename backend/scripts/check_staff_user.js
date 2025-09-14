const mongoose = require('mongoose');
require('dotenv').config();

// Import models
require('./models/User');
require('./models/BookingAlert');

const User = mongoose.model('User');
const BookingAlert = mongoose.model('BookingAlert');

async function checkStaffUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');

    // Find staff users
    const staffUsers = await User.find({ role: 'staff' });
    logger.log('\n=== STAFF USERS ===');
    staffUsers.forEach(staff => {
      logger.log(`Name: ${staff.name}`);
      logger.log(`Email: ${staff.email}`);
      logger.log(`ID: ${staff._id}`);
      logger.log(`Location Area: ${staff.locationArea || 'None'}`);
      logger.log(`Location Area Type: ${typeof staff.locationArea}`);
      logger.log('---');
    });

    // Check open booking alerts
    const openAlerts = await BookingAlert.find({ status: 'open' });
    logger.log('\n=== OPEN BOOKING ALERTS ===');
    openAlerts.forEach(alert => {
      logger.log(`Title: ${alert.title}`);
      logger.log(`Send to All: ${alert.sendToAll}`);
      logger.log(`Selected Location Areas: ${JSON.stringify(alert.selectedLocationAreas)}`);
      logger.log(`Status: ${alert.status}`);
      logger.log('---');
    });

    // Test alert filtering logic for each staff user
    logger.log('\n=== ALERT FILTERING TEST ===');
    for (const staff of staffUsers) {
      logger.log(`\nTesting for staff: ${staff.name}`);
      
      const targetedAlerts = openAlerts.filter(alert => {
        // Only show open alerts to staff (exclude confirmed, cancelled, etc.)
        if (alert.status !== 'open') {
          logger.log(`  - Alert "${alert.title}" filtered out: status is ${alert.status}`);
          return false;
        }

        // If sendToAll is true, show to all staff
        if (alert.sendToAll) {
          logger.log(`  - Alert "${alert.title}" included: sendToAll is true`);
          return true;
        }

        // If specific location areas are selected, check if user's location area matches
        if (alert.selectedLocationAreas && alert.selectedLocationAreas.length > 0) {
          const userLocationAreaId = staff.locationArea?._id || staff.locationArea;
          const matches = alert.selectedLocationAreas.includes(userLocationAreaId);
          logger.log(`  - Alert "${alert.title}" ${matches ? 'included' : 'filtered out'}: location area ${matches ? 'matches' : 'does not match'}`);
          return matches;
        }

        logger.log(`  - Alert "${alert.title}" filtered out: no targeting criteria met`);
        return false;
      });
      
      logger.log(`  Result: ${targetedAlerts.length} alerts should be visible to ${staff.name}`);
    }

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    logger.log('\nDisconnected from MongoDB');
  }
}

checkStaffUser();