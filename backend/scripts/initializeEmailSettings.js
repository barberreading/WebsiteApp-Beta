const mongoose = require('mongoose');
const EmailSettings = require('../models/EmailSettings');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const initializeEmailSettings = async () => {
  try {
    // Check if email settings already exist
    const existingSettings = await EmailSettings.findOne();
    
    if (existingSettings) {
      logger.log('Email settings already exist:', existingSettings);
      return;
    }

    // Create default email settings using environment variables
    const defaultSettings = new EmailSettings({
      host: process.env.EMAIL_HOST || 'smtp.ionos.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER || 'your_email@yourdomain.com',
        pass: process.env.EMAIL_PASSWORD || 'your_email_password'
      },
      from: {
        name: 'Staff Management System',
        email: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@yourdomain.com'
      },
      enabled: process.env.EMAIL_ENABLED === 'true' || true
    });

    await defaultSettings.save();
    logger.log('Default email settings created successfully:', defaultSettings);
  } catch (error) {
    logger.error('Error initializing email settings:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the initialization
connectDB().then(() => {
  initializeEmailSettings();
});