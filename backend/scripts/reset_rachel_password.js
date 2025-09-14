const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function resetRachelPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    const rachel = await User.findOne({ email: 'rachel.green@everythingchildcareagency.co.uk' });
    
    if (!rachel) {
      logger.log('Rachel Green not found');
      return;
    }
    
    logger.log('Found Rachel Green:', rachel.name);
    logger.log('Current password hash exists:', !!rachel.password);
    
    // Hash the password Staff123!
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Staff123!', salt);
    
    // Update Rachel's password
    await User.findByIdAndUpdate(rachel._id, { 
      password: hashedPassword,
      isActive: true
    });
    
    logger.log('✅ Password reset to "Staff123!" for Rachel Green');
    logger.log('✅ User set to active');
    
    // Verify the password works
    const updatedRachel = await User.findById(rachel._id);
    const isMatch = await bcrypt.compare('Staff123!', updatedRachel.password);
    logger.log('✅ Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    logger.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.log('Disconnected from MongoDB');
  }
}

resetRachelPassword();