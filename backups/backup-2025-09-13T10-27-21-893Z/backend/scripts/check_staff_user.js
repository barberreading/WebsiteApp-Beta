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
    console.log('Connected to MongoDB');

    // Find staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log('\n=== STAFF USERS ===');
    staffUsers.forEach(staff => {
      console.log(`Name: ${staff.name}`);
      console.log(`Email: ${staff.email}`);
      console.log(`ID: ${staff._id}`);
      console.log(`Location Area: ${staff.locationArea || 'None'}`);
      console.log(`Location Area Type: ${typeof staff.locationArea}`);
      console.log('---');
    });

    // Check open booking alerts
    const openAlerts = await BookingAlert.find({ status: 'open' });
    console.log('\n=== OPEN BOOKING ALERTS ===');
    openAlerts.forEach(alert => {
      console.log(`Title: ${alert.title}`);
      console.log(`Send to All: ${alert.sendToAll}`);
      console.log(`Selected Location Areas: ${JSON.stringify(alert.selectedLocationAreas)}`);
      console.log(`Status: ${alert.status}`);
      console.log('---');
    });

    // Test alert filtering logic for each staff user
    console.log('\n=== ALERT FILTERING TEST ===');
    for (const staff of staffUsers) {
      console.log(`\nTesting for staff: ${staff.name}`);
      
      const targetedAlerts = openAlerts.filter(alert => {
        // Only show open alerts to staff (exclude confirmed, cancelled, etc.)
        if (alert.status !== 'open') {
          console.log(`  - Alert "${alert.title}" filtered out: status is ${alert.status}`);
          return false;
        }

        // If sendToAll is true, show to all staff
        if (alert.sendToAll) {
          console.log(`  - Alert "${alert.title}" included: sendToAll is true`);
          return true;
        }

        // If specific location areas are selected, check if user's location area matches
        if (alert.selectedLocationAreas && alert.selectedLocationAreas.length > 0) {
          const userLocationAreaId = staff.locationArea?._id || staff.locationArea;
          const matches = alert.selectedLocationAreas.includes(userLocationAreaId);
          console.log(`  - Alert "${alert.title}" ${matches ? 'included' : 'filtered out'}: location area ${matches ? 'matches' : 'does not match'}`);
          return matches;
        }

        console.log(`  - Alert "${alert.title}" filtered out: no targeting criteria met`);
        return false;
      });
      
      console.log(`  Result: ${targetedAlerts.length} alerts should be visible to ${staff.name}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkStaffUser();