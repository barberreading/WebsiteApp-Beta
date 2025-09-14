require('dotenv').config();
const mongoose = require('mongoose');
const EmailSettings = require('./models/EmailSettings');

async function checkSenderInfo() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const settings = await EmailSettings.findOne();
    
    if (settings) {
      console.log('\nEmail Settings Found:');
      console.log('Sender Name:', settings.from.name);
      console.log('Sender Email:', settings.from.email);
      console.log('SMTP User:', settings.auth.user);
      console.log('SMTP Host:', settings.host);
      console.log('SMTP Port:', settings.port);
      
      if (settings.from.email !== settings.auth.user) {
        console.log('\n⚠️  WARNING: Sender email does not match SMTP authentication user!');
        console.log('This may cause the "Sender address is not allowed" error.');
        console.log('Sender email:', settings.from.email);
        console.log('SMTP user:', settings.auth.user);
      } else {
        console.log('\n✅ Sender email matches SMTP user');
      }
    } else {
      console.log('No email settings found in database');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSenderInfo();