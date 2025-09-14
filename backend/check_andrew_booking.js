const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
require('dotenv').config();

async function checkAndrewBooking() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
    
    // First, let's find any user named Andrew Barber
    const andrewUser = await User.findOne({ 
      $or: [
        { name: /andrew.*barber/i },
        { firstName: /andrew/i, lastName: /barber/i }
      ]
    });
    
    console.log('Andrew Barber user found:', andrewUser ? andrewUser.name : 'Not found');
    
    // Check for bookings with Andrew in the title or as client
    const bookings = await Booking.find({
      $or: [
        { title: /andrew.*barber/i },
        { client: andrewUser ? andrewUser._id : null },
        { notes: /andrew.*barber/i }
      ]
    })
    .populate('client', 'name email')
    .populate('staff', 'name')
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
    
    console.log(`\nFound ${bookings.length} bookings for Andrew Barber:`);
    
    bookings.forEach((booking, index) => {
      console.log(`\n--- Booking ${index + 1} ---`);
      console.log('ID:', booking._id);
      console.log('Title:', booking.title);
      console.log('Client:', booking.client?.name || 'No client');
      console.log('Staff:', booking.staff?.name || 'No staff');
      console.log('Service:', booking.service?.name || 'No service');
      console.log('Start Time:', booking.startTime);
      console.log('End Time:', booking.endTime);
      console.log('Status:', booking.status);
      console.log('Created At:', booking.createdAt);
      console.log('Notes:', booking.notes || 'No notes');
    });
    
    // Also check for recent bookings around the 15th
    const recentBookings = await Booking.find({
      startTime: {
        $gte: new Date('2025-01-14'),
        $lte: new Date('2025-01-16')
      }
    })
    .populate('client', 'name email')
    .populate('staff', 'name')
    .populate('service', 'name')
    .sort({ startTime: 1 });
    
    console.log(`\n\nBookings around January 15th (${recentBookings.length} found):`);
    recentBookings.forEach((booking, index) => {
      console.log(`\n--- Booking ${index + 1} ---`);
      console.log('Title:', booking.title);
      console.log('Client:', booking.client?.name || 'No client');
      console.log('Staff:', booking.staff?.name || 'No staff');
      console.log('Start Time:', booking.startTime);
      console.log('Status:', booking.status);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAndrewBooking();