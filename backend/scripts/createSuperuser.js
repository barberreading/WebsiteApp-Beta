const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createSuperuser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.log('MongoDB Connected...');

    // Check if superuser already exists
    const existingSuperuser = await User.findOne({ role: 'superuser' });
    
    if (existingSuperuser) {
      logger.log('A superuser already exists in the database.');
      process.exit(0);
    }

    // Create superuser
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        logger.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
        logger.log('Please set these environment variables before running this script:');
        logger.log('  ADMIN_EMAIL=your-admin@example.com');
        logger.log('  ADMIN_PASSWORD=your-secure-password');
        process.exit(1);
    }
    
    const superuser = new User({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'superuser',
      consentGiven: true
    });

    await superuser.save();

    logger.log('✅ Superuser created successfully!');
    logger.log(`📧 Email: ${adminEmail}`);
    logger.log('🔑 Password: [Set via environment variable]');
    logger.log('Please change this password after first login!');

    process.exit(0);
  } catch (err) {
    logger.error('Error creating superuser:', err.message);
    process.exit(1);
  }
};

createSuperuser();