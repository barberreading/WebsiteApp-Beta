require('dotenv').config();
const mongoose = require('mongoose');
const BookingAlert = require('./models/BookingAlert');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.log('Connected to MongoDB');
    
    const alerts = await BookingAlert.find({}).select('_id title status claimedBy');
    
    logger.log('\nCurrent booking alert statuses:');
    logger.log('================================');
    
    alerts.forEach(alert => {
      logger.log(`ID: ${alert._id}`);
      logger.log(`Title: ${alert.title}`);
      logger.log(`Status: ${alert.status}`);
      logger.log(`ClaimedBy: ${alert.claimedBy || 'None'}`);
      logger.log('---');
    });
    
    logger.log(`\nTotal alerts: ${alerts.length}`);
    
    process.exit(0);
  })
  .catch(err => {
    logger.error('Error:', err);
    process.exit(1);
  });