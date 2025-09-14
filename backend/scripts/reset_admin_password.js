const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  logger.log('MongoDB Connected');
  
  try {
    // Find admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const plainPassword = process.env.ADMIN_PASSWORD || (() => {
      logger.error('ERROR: ADMIN_PASSWORD environment variable not set');
      logger.log('Please set ADMIN_PASSWORD environment variable before running this script');
      process.exit(1);
    })();
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Update or create admin user
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        $set: { 
          password: hashedPassword,
          isTemporaryPassword: false
        }
      },
      { new: true, upsert: false }
    );
    
    if (user) {
      logger.log('Admin password reset successfully');
      logger.log('Login with:');
      logger.log('Email:', adminEmail);
      logger.log('Password:', plainPassword);
    } else {
      logger.log('Admin user not found');
    }
    
    process.exit(0);
  } catch (err) {
    logger.error('Error:', err);
    process.exit(1);
  }
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});