require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');
const { Service } = require('./models/Service');
const Client = require('./models/Client');

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    // Find a staff user
    const staffUser = await User.findOne({ role: 'staff' });
    if (!staffUser) {
      logger.log('No staff user found');
      process.exit(1);
    }
    
    logger.log('Found staff user:', staffUser.name, staffUser.email);
    
    // Find a service and client
    const service = await Service.findOne();
    const client = await Client.findOne();
    const manager = await User.findOne({ role: { $in: ['manager', 'admin', 'superuser'] } });
    
    if (!service || !client || !manager) {
      logger.log('Missing required data - Service:', !!service, 'Client:', !!client, 'Manager:', !!manager);
      process.exit(1);
    }
    
    // Create a test booking alert with 'open' status
    const testAlert = new BookingAlert({
      title: 'Test Open Alert for Staff',
      description: 'This is a test alert that should be visible to staff',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      service: service._id,
      client: client._id,
      location: {
        address: '123 Test Street',
        city: 'Test City',
        postcode: 'TE5T 1NG'
      },
      manager: manager._id,
      status: 'open',
      sendToAll: true,
      selectedLocationAreas: [],
      bookingKey: 'TEST123'
    });
    
    await testAlert.save();
    logger.log('Created test booking alert:', testAlert.title);
    
    // Create a test leave request for the staff user (must be at least one week in advance)
     const testLeave = new LeaveRequest({
       staff: staffUser._id,
       startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
       endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
       reason: 'Test leave request for debugging',
       status: 'approved'
     });
    
    await testLeave.save();
    logger.log('Created test leave request for:', staffUser.name);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

createTestData();