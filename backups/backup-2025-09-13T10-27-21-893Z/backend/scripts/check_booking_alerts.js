require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');

async function checkBookingAlerts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const count = await BookingAlert.countDocuments();
    console.log('Total booking alerts:', count);
    
    // Get all booking alerts
    const alerts = await BookingAlert.find()
      .limit(10);
    
    console.log('Sample booking alerts:');
    alerts.forEach(alert => {
      console.log('- Alert:', alert.title);
      console.log('  Status:', alert.status);
      console.log('  Start:', alert.startTime);
      console.log('  End:', alert.endTime);
      console.log('  Send to all:', alert.sendToAll);
      console.log('  Location areas:', alert.selectedLocationAreas);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookingAlerts();