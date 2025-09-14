require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');

async function checkBookingAlerts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    const count = await BookingAlert.countDocuments();
    logger.log('Total booking alerts:', count);
    
    // Get all booking alerts
    const alerts = await BookingAlert.find()
      .limit(10);
    
    logger.log('Sample booking alerts:');
    alerts.forEach(alert => {
      logger.log('- Alert:', alert.title);
      logger.log('  Status:', alert.status);
      logger.log('  Start:', alert.startTime);
      logger.log('  End:', alert.endTime);
      logger.log('  Send to all:', alert.sendToAll);
      logger.log('  Location areas:', alert.selectedLocationAreas);
      logger.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkBookingAlerts();