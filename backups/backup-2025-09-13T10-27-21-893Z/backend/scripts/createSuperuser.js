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
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeMe123!';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    
    const superuser = new User({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'superuser',
      consentGiven: true
    });

    await superuser.save();

    console.log('Superuser created successfully:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Please change this password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('Error creating superuser:', err.message);
    process.exit(1);
  }
};

createSuperuser();