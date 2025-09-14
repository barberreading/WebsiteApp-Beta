require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return checkSMTPConfig();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function checkSMTPConfig() {
  try {
    // First, let's see what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== Available Collections ===');
    collections.forEach(col => console.log('-', col.name));
    
    // Try to find EmailSettings with a flexible schema
    const EmailSettings = mongoose.model('EmailSettings', new mongoose.Schema({}, { strict: false }));
    const settings = await EmailSettings.findOne();
    
    if (settings) {
      console.log('\n=== Raw Email Settings Document ===');
      console.log(JSON.stringify(settings.toObject(), null, 2));
      
      // Try common field names
      const possibleFields = {
        host: settings.host || settings.smtpHost || settings.smtp_host,
        port: settings.port || settings.smtpPort || settings.smtp_port,
        user: settings.user || settings.smtpUser || settings.smtp_user || settings.username,
        password: settings.password || settings.smtpPassword || settings.smtp_password,
        senderEmail: settings.senderEmail || settings.sender_email || settings.from || settings.fromEmail,
        senderName: settings.senderName || settings.sender_name || settings.fromName,
        enabled: settings.enabled || settings.isEnabled || settings.is_enabled
      };
      
      console.log('\n=== Parsed SMTP Configuration ===');
      console.log('SMTP Host:', possibleFields.host);
      console.log('SMTP Port:', possibleFields.port);
      console.log('SMTP User:', possibleFields.user);
      console.log('Sender Email:', possibleFields.senderEmail);
      console.log('Sender Name:', possibleFields.senderName);
      console.log('Is Enabled:', possibleFields.enabled);
      
    } else {
      console.log('\n❌ No email settings found in EmailSettings collection');
      
      // Try other possible collection names
      const alternativeNames = ['emailsettings', 'email_settings', 'mailsettings', 'settings'];
      for (const name of alternativeNames) {
        try {
          const AltModel = mongoose.model(name, new mongoose.Schema({}, { strict: false }));
          const altSettings = await AltModel.findOne();
          if (altSettings) {
            console.log(`\n✅ Found settings in '${name}' collection:`);
            console.log(JSON.stringify(altSettings.toObject(), null, 2));
            break;
          }
        } catch (err) {
          // Collection doesn't exist, continue
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking SMTP config:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}