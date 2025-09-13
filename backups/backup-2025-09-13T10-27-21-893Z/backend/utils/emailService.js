const nodemailer = require('nodemailer');
const EmailSettings = require('../models/EmailSettings');

/**
 * Create a transporter based on current email settings
 */
const createTransporter = async () => {
  try {
    const settings = await EmailSettings.findOne();
    
    if (!settings) {
      throw new Error('Email settings not configured');
    }

    const transporter = nodemailer.createTransporter({
      host: settings.host,
      port: settings.port,
      secure: settings.secure, // true for 465, false for other ports
      auth: {
        user: settings.auth.user,
        pass: settings.auth.pass
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

/**
 * Send a test email to verify email configuration
 */
const sendTestEmail = async (toEmail, fromEmail = null) => {
  try {
    const transporter = await createTransporter();
    const settings = await EmailSettings.findOne();
    
    const mailOptions = {
      from: fromEmail || settings.auth.user,
      to: toEmail,
      subject: 'Test Email - Configuration Verification',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify that your email configuration is working correctly.</p>
        <p><strong>Sent from:</strong> ${fromEmail || settings.auth.user}</p>
        <p><strong>Server:</strong> ${settings.host}:${settings.port}</p>
        <p><strong>Secure:</strong> ${settings.secure ? 'Yes' : 'No'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p><em>If you received this email, your email configuration is working properly!</em></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

/**
 * Send a general email
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    const settings = await EmailSettings.findOne();
    
    const mailOptions = {
      from: options.from || settings.auth.user,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = await createTransporter();
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('Email configuration verified successfully');
      return { success: true, message: 'Email configuration is valid' };
    } else {
      throw new Error('Email configuration verification failed');
    }
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  createTransporter,
  sendTestEmail,
  sendEmail,
  verifyEmailConfig
};