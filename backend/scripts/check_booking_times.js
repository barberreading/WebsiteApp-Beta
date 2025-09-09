const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function checkBookingTimes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/staff-management');
    
    const booking = await Booking.findOne()
      .populate('staff', 'name')
      .populate('client', 'name firstName lastName');
    
    if (booking) {
      console.log('Sample booking data:');
      console.log('ID:', booking._id);
      console.log('Start Time:', booking.startTime);
      console.log('End Time:', booking.endTime);
      console.log('Duration (minutes):', (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60));
      console.log('Staff:', booking.staff?.name);
      console.log('Client:', booking.client?.firstName, booking.client?.lastName);
    } else {
      console.log('No bookings found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookingTimes();