const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function checkBookingTimes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    
    const booking = await Booking.findOne()
      .populate('staff', 'name')
      .populate('client', 'name firstName lastName');
    
    if (booking) {
      logger.log('Sample booking data:');
      logger.log('ID:', booking._id);
      logger.log('Start Time:', booking.startTime);
      logger.log('End Time:', booking.endTime);
      logger.log('Duration (minutes):', (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60));
      logger.log('Staff:', booking.staff?.name);
      logger.log('Client:', booking.client?.firstName, booking.client?.lastName);
    } else {
      logger.log('No bookings found');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkBookingTimes();