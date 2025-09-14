const mongoose = require('mongoose');
const Booking = require('./models/Booking');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(async () => {
    console.log('Connected to MongoDB');
    const bookings = await Booking.find().select('_id title');
    console.log('Available bookings:');
    bookings.forEach(b => console.log(`ID: ${b._id}, Title: ${b.title}`));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });