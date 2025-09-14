const mongoose = require('mongoose');
const Booking = require('./models/Booking');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.log('Connected to MongoDB');
    const bookings = await Booking.find().select('_id title');
    logger.log('Available bookings:');
    bookings.forEach(b => logger.log(`ID: ${b._id}, Title: ${b.title}`));
    mongoose.disconnect();
  })
  .catch(err => {
    logger.error('Error:', err);
    mongoose.disconnect();
  });