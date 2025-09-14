const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkRachelPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    const rachel = await User.findOne({ email: 'rachel.green@everythingchildcareagency.co.uk' }).select('+password');
    
    if (!rachel) {
      logger.log('Rachel Green not found');
      return;
    }
    
    logger.log('Rachel Green details:');
    logger.log('- Name:', rachel.name);
    logger.log('- Email:', rachel.email);
    logger.log('- Role:', rachel.role);
    logger.log('- Password field exists:', 'password' in rachel);
    logger.log('- Password value:', rachel.password);
    logger.log('- Password type:', typeof rachel.password);
    logger.log('- Password length:', rachel.password ? rachel.password.length : 'N/A');
    logger.log('- Is Active:', rachel.isActive);
    
  } catch (error) {
    logger.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.log('Disconnected from MongoDB');
  }
}

checkRachelPassword();