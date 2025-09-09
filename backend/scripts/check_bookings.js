require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const count = await Booking.countDocuments();
    console.log('Total bookings:', count);
    
    // Check bookings in the specific date range from the error
    const startDate = new Date('2025-08-31T23:00:00.000Z');
    const endDate = new Date('2025-10-12T23:00:00.000Z');
    
    const rangeCount = await Booking.countDocuments({
      startTime: { $gte: startDate, $lte: endDate }
    });
    console.log('Bookings in problematic date range:', rangeCount);
    
    // Get sample bookings to see data size (without populate to avoid errors)
    const sampleBookings = await Booking.find({
      startTime: { $gte: startDate, $lte: endDate }
    })
    .select('startTime endTime service staff client status notes')
    .limit(10);
    
    console.log('Sample bookings (raw):', JSON.stringify(sampleBookings, null, 2));
    console.log('Sample response size (bytes):', JSON.stringify(sampleBookings).length);
    
    // Check if there are too many bookings in the range
    if (rangeCount > 100) {
      console.log('WARNING: Large number of bookings in date range may cause performance issues');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookings();