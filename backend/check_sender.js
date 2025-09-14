require('dotenv').config();
const mongoose = require('mongoose');
const EmailSettings = require('./models/EmailSettings');

async function checkSenderInfo() {
  try {
    logger.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    const settings = await EmailSettings.findOne();
    
    if (settings) {
      logger.log('\nEmail Settings Found:');
      logger.log('Sender Name:', settings.from.name);
      logger.log('Sender Email:', settings.from.email);
      logger.log('SMTP User:', settings.auth.user);
      logger.log('SMTP Host:', settings.host);
      logger.log('SMTP Port:', settings.port);
      
      if (settings.from.email !== settings.auth.user) {
        logger.log('\n⚠️  WARNING: Sender email does not match SMTP authentication user!');
        logger.log('This may cause the "Sender address is not allowed" error.');
        logger.log('Sender email:', settings.from.email);
        logger.log('SMTP user:', settings.auth.user);
      } else {
        logger.log('\n✅ Sender email matches SMTP user');
      }
    } else {
      logger.log('No email settings found in database');
    }
    
    await mongoose.disconnect();
    logger.log('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

checkSenderInfo();