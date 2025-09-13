const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Client = require('./models/Client');
const { Service } = require('./models/Service');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createSampleBookings() {
  try {
    // Get existing users, clients, and services
    const staff = await User.findOne({ role: 'staff' });
    const client = await Client.findOne();
    const service = await Service.findOne();
    
    if (!staff || !client) {
      console.log('No staff or client found. Creating sample data...');
      return;
    }

    if (!service) {
      console.log('No service found. Creating a sample service...');
      const newService = await Service.create({
        name: 'Childcare Service',
        description: 'General childcare service',
        price: 100,
        createdBy: staff._id
      });
      console.log('Created service:', newService.name);
    }

    const serviceToUse = service || await Service.findOne();
    console.log('Found staff:', staff.name);
    console.log('Found client:', client.name);
    console.log('Using service:', serviceToUse.name);

    // Create sample bookings
    const sampleBookings = [
      {
        title: 'Morning Childcare Session',
        description: 'Sample booking 1',
        client: client._id,
        staff: staff._id,
        service: serviceToUse._id,
        startTime: new Date('2024-12-15T09:00:00Z'),
        endTime: new Date('2024-12-15T17:00:00Z'),
        status: 'scheduled'
      },
      {
        title: 'Afternoon Childcare Session',
        description: 'Sample booking 2',
        client: client._id,
        staff: staff._id,
        service: serviceToUse._id,
        startTime: new Date('2024-12-16T10:00:00Z'),
        endTime: new Date('2024-12-16T18:00:00Z'),
        status: 'scheduled'
      },
      {
        title: 'Full Day Childcare',
        description: 'Sample booking 3',
        client: client._id,
        staff: staff._id,
        service: serviceToUse._id,
        startTime: new Date('2024-12-17T08:00:00Z'),
        endTime: new Date('2024-12-17T16:00:00Z'),
        status: 'completed'
      }
    ];

    // Delete existing bookings first
    await Booking.deleteMany({});
    console.log('Cleared existing bookings');

    // Create new bookings
    const createdBookings = await Booking.insertMany(sampleBookings);
    console.log(`Created ${createdBookings.length} sample bookings`);

    // Verify bookings were created
    const bookingCount = await Booking.countDocuments();
    console.log(`Total bookings in database: ${bookingCount}`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating sample bookings:', error);
    mongoose.disconnect();
  }
}

createSampleBookings();