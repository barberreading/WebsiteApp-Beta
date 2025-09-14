const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('./models/Booking');
const User = require('./models/User');
const Client = require('./models/Client');
const { Service } = require('./models/Service');

async function createTestBookingForStaff() {
  try {
    logger.log('=== CREATING TEST BOOKING FOR STAFF USER ===');
    
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
    
    logger.log('Staff user found:', staffUser.name, '(', staffUser._id, ')');
    
    // Find a client to use for the booking
    const client = await Client.findOne();
    if (!client) {
      logger.error('No clients found! Creating a test client...');
      
      const testClient = new Client({
        firstName: 'Test',
        lastName: 'Client',
        email: 'testclient@example.com',
        phone: '123-456-7890',
        address: '123 Test Street',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '987-654-3210',
          relationship: 'Parent'
        }
      });
      
      await testClient.save();
      logger.log('Test client created:', testClient.firstName, testClient.lastName);
      client = testClient;
    } else {
      logger.log('Using existing client:', client.firstName, client.lastName);
    }
    
    // Find a service to use for the booking
    let service = await Service.findOne();
    if (!service) {
      logger.log('No services found! Creating a test service...');
      
      const testService = new Service({
        name: 'Childcare Service',
        description: 'General childcare service',
        bookingKey: 'childcare-service'
      });
      
      await testService.save();
      logger.log('Test service created:', testService.name);
      service = testService;
    } else {
      logger.log('Using existing service:', service.name);
    }
    
    // Create test bookings for the next few days
    const bookingsToCreate = [
      {
        title: 'Morning Childcare Session',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Tomorrow 9 AM
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Tomorrow 11 AM
        description: 'Test booking for staff calendar - Morning session'
      },
      {
        title: 'Afternoon Childcare Session',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Day after tomorrow 2 PM
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000), // Day after tomorrow 3:30 PM
        description: 'Test booking for staff calendar - Afternoon session'
      },
      {
        title: 'Extended Childcare Session',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 10.5 * 60 * 60 * 1000), // 3 days from now 10:30 AM
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 13.5 * 60 * 60 * 1000), // 3 days from now 1:30 PM
        description: 'Test booking for staff calendar - Extended session'
      }
    ];
    
    logger.log('\nCreating test bookings...');
    
    for (let i = 0; i < bookingsToCreate.length; i++) {
      const bookingData = bookingsToCreate[i];
      
      const booking = new Booking({
        title: bookingData.title,
        description: bookingData.description,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        service: service._id,
        staff: staffUser._id,
        client: client._id
      });
      
      await booking.save();
      
      logger.log(`Booking ${i + 1} created:`);
      logger.log('- Title:', bookingData.title);
      logger.log('- Start Time:', bookingData.startTime.toLocaleString());
      logger.log('- End Time:', bookingData.endTime.toLocaleString());
      logger.log('- ID:', booking._id);
    }
    
    // Verify bookings were created
    logger.log('\nVerifying created bookings...');
    const staffBookings = await Booking.find({ staff: staffUser._id })
      .populate('client', 'firstName lastName')
      .populate('service', 'name')
      .sort({ date: 1 });
    
    logger.log('Total bookings for staff user:', staffBookings.length);
    
    staffBookings.forEach((booking, index) => {
      logger.log(`Booking ${index + 1}:`);
      logger.log('- Title:', booking.title);
      logger.log('- Client:', booking.client.firstName, booking.client.lastName);
      logger.log('- Service:', booking.service.name);
      logger.log('- Start Time:', booking.startTime.toLocaleString());
      logger.log('- End Time:', booking.endTime.toLocaleString());
    });
    
    logger.log('\n=== TEST BOOKING CREATION COMPLETE ===');
    
  } catch (error) {
    logger.error('Error creating test bookings:', error);
  } finally {
    await mongoose.connection.close();
    logger.log('Database connection closed');
  }
}

createTestBookingForStaff();