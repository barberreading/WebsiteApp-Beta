require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const alerts = await BookingAlert.find({}).select('_id title status claimedBy');
    
    console.log('\nCurrent booking alert statuses:');
    console.log('================================');
    
    alerts.forEach(alert => {
      console.log(`ID: ${alert._id}`);
      console.log(`Title: ${alert.title}`);
      console.log(`Status: ${alert.status}`);
      console.log(`ClaimedBy: ${alert.claimedBy || 'None'}`);
      console.log('---');
    });
    
    console.log(`\nTotal alerts: ${alerts.length}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });