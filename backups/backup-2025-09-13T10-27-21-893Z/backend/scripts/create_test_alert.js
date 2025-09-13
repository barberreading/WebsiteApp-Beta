const mongoose = require('mongoose');
require('dotenv').config();

// Import models
require('./models/User');
require('./models/BookingAlert');
require('./models/Service');
require('./models/Client');

const BookingAlert = mongoose.model('BookingAlert');
const User = mongoose.model('User');
const Service = mongoose.model('Service');
const Client = mongoose.model('Client');

async function createTestAlert() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a manager user to create the alert
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.log('No manager found to create alert');
      return;
    }

    // Find a service and client
    const service = await Service.findOne({});
    const client = await Client.findOne({});

    if (!service) {
      console.log('Missing service data');
      return;
    }

    if (!client) {
      console.log('Missing client data');
      return;
    }

    // Create a test alert with 'open' status
    const testAlert = new BookingAlert({
      title: 'URGENT: Staff Needed - Test Alert',
      description: 'This is a test booking alert that should be visible to all staff members. Please respond if available.',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
      service: service._id,
      location: {
        address: '123 Test Street, Test City',
        city: 'Test City',
        postcode: 'TE5T 1NG'
      },
      manager: manager._id,
      client: client._id,
      bookingKey: 'TEST-OPEN-ALERT-' + Date.now(),
      status: 'open', // This is the key - making sure it's 'open'
      sendToAll: true, // Send to all staff
      selectedLocationAreas: [],
      sendAsNotification: true,
      sendAsEmail: false,
      emailsSent: false,
      rejectedStaff: []
    });

    await testAlert.save();
    console.log('\n=== TEST ALERT CREATED ===');
    console.log(`Alert ID: ${testAlert._id}`);
    console.log(`Title: ${testAlert.title}`);
    console.log(`Status: ${testAlert.status}`);
    console.log(`Send to All: ${testAlert.sendToAll}`);
    console.log(`Start Time: ${testAlert.startTime}`);
    console.log(`End Time: ${testAlert.endTime}`);

    // Verify the alert was created
    const openAlerts = await BookingAlert.find({ status: 'open' });
    console.log(`\nTotal open alerts in database: ${openAlerts.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createTestAlert();