const nodemailer = require('nodemailer');

/**
 * Send test email to verify email settings
 * @param {Object} settings - Email settings object
 * @param {String} testEmail - Email address to send test to
 */
const sendTestEmail = async (settings, testEmail) => {
  try {
    // Create test transporter with provided settings
    const testTransporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.auth.user,
        pass: settings.auth.pass
      }
    });
    
    // Send test email
    const info = await testTransporter.sendMail({
      from: `"${settings.from.name}" <${settings.from.email}>`,
      to: testEmail,
      subject: 'Email Settings Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">Email Settings Test</h2>
          <p>This is a test email to verify your email settings are working correctly.</p>
          <p>If you received this email, your settings are configured properly!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Host:</strong> ${settings.host}</p>
            <p><strong>Port:</strong> ${settings.port}</p>
            <p><strong>Secure:</strong> ${settings.secure ? 'Yes' : 'No'}</p>
            <p><strong>From:</strong> ${settings.from.name} (${settings.from.email})</p>
          </div>
          
          <p>You can now use these settings for sending emails from your application.</p>
        </div>
      `
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

module.exports = sendTestEmail;