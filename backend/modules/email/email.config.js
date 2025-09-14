const nodemailer = require('nodemailer');
const EmailSettings = require('../../models/EmailSettings');

// Get email settings from database
const getEmailTransporter = async () => {
  try {
    // Try to get settings from database
    const settings = await EmailSettings.findOne();
    
    if (settings && settings.enabled) {
      return nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: {
          user: settings.auth.user,
          pass: settings.auth.pass
        }
      });
    }
  } catch (error) {
    logger.error('Error getting email settings:', error);
  }
  
  // Fallback to environment variables if no settings in database or settings disabled
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'user@example.com',
      pass: process.env.EMAIL_PASSWORD || 'password'
    }
  });
};

// Get sender info from database
const getSenderInfo = async () => {
  try {
    const settings = await EmailSettings.findOne();
    
    if (settings && settings.enabled) {
      return `"${settings.from.name}" <${settings.from.email}>`;
    }
  } catch (error) {
    logger.error('Error getting sender info:', error);
  }
  
  // Fallback to environment variables
  return `"${process.env.EMAIL_SENDER_NAME || 'Staff Management'}" <${process.env.EMAIL_SENDER_EMAIL || 'noreply@example.com'}>`;
};

module.exports = { getEmailTransporter, getSenderInfo };