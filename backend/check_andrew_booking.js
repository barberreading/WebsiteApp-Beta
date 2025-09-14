const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
require('dotenv').config();

async function checkAndrewBooking() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    logger.log('Connected to MongoDB');
    
    // First, let's find any user named Andrew Barber
    const andrewUser = await User.findOne({ 
      $or: [
        { name: /andrew.*barber/i },
        { firstName: /andrew/i, lastName: /barber/i }
      ]
    });
    
    logger.log('Andrew Barber user found:', andrewUser ? andrewUser.name : 'Not found');
    
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
    
    logger.log(`\nFound ${bookings.length} bookings for Andrew Barber:`);
    
    bookings.forEach((booking, index) => {
      logger.log(`\n--- Booking ${index + 1} ---`);
      logger.log('ID:', booking._id);
      logger.log('Title:', booking.title);
      logger.log('Client:', booking.client?.name || 'No client');
      logger.log('Staff:', booking.staff?.name || 'No staff');
      logger.log('Service:', booking.service?.name || 'No service');
      logger.log('Start Time:', booking.startTime);
      logger.log('End Time:', booking.endTime);
      logger.log('Status:', booking.status);
      logger.log('Created At:', booking.createdAt);
      logger.log('Notes:', booking.notes || 'No notes');
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
    
    logger.log(`\n\nBookings around January 15th (${recentBookings.length} found):`);
    recentBookings.forEach((booking, index) => {
      logger.log(`\n--- Booking ${index + 1} ---`);
      logger.log('Title:', booking.title);
      logger.log('Client:', booking.client?.name || 'No client');
      logger.log('Staff:', booking.staff?.name || 'No staff');
      logger.log('Start Time:', booking.startTime);
      logger.log('Status:', booking.status);
    });
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAndrewBooking();