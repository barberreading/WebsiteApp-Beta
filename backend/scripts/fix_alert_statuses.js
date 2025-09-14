require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');

async function fixAlertStatuses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    // Update all 'claimed' alerts to 'pending_confirmation'
    const result = await BookingAlert.updateMany(
      { status: 'claimed' },
      { status: 'pending_confirmation' }
    );
    
    logger.log(`Updated ${result.modifiedCount} alerts from 'claimed' to 'pending_confirmation'`);
    
    // Verify the changes
    const alerts = await BookingAlert.find({}).select('_id title status claimedBy');
    logger.log('\nCurrent alert statuses:');
    alerts.forEach(alert => {
      logger.log(`ID: ${alert._id}, Title: ${alert.title}, Status: ${alert.status}, ClaimedBy: ${alert.claimedBy || 'None'}`);
    });
    
    await mongoose.connection.close();
    logger.log('\nDatabase connection closed');
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

fixAlertStatuses();