require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');

async function fixAlertStatuses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Update all 'claimed' alerts to 'pending_confirmation'
    const result = await BookingAlert.updateMany(
      { status: 'claimed' },
      { status: 'pending_confirmation' }
    );
    
    console.log(`Updated ${result.modifiedCount} alerts from 'claimed' to 'pending_confirmation'`);
    
    // Verify the changes
    const alerts = await BookingAlert.find({}).select('_id title status claimedBy');
    console.log('\nCurrent alert statuses:');
    alerts.forEach(alert => {
      console.log(`ID: ${alert._id}, Title: ${alert.title}, Status: ${alert.status}, ClaimedBy: ${alert.claimedBy || 'None'}`);
    });
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAlertStatuses();