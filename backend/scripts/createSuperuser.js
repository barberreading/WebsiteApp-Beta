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

    console.log('MongoDB Connected...');

    // Check if superuser already exists
    const existingSuperuser = await User.findOne({ role: 'superuser' });
    
    if (existingSuperuser) {
      console.log('A superuser already exists in the database.');
      process.exit(0);
    }

    // Create superuser
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
        console.log('Please set these environment variables before running this script:');
        console.log('  ADMIN_EMAIL=your-admin@example.com');
        console.log('  ADMIN_PASSWORD=your-secure-password');
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

    console.log('✅ Superuser created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log('🔑 Password: [Set via environment variable]');
    console.log('Please change this password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('Error creating superuser:', err.message);
    process.exit(1);
  }
};

createSuperuser();