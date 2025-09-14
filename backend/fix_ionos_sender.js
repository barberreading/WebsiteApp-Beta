require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixIONOSSender = async () => {
  await connectDB();
  
  try {
    // Get current email settings
    const emailSettings = await mongoose.connection.db.collection('emailsettings').findOne({});
    
    if (!emailSettings) {
      console.log('❌ No email settings found in database');
      return;
    }
    
    console.log('📧 Current Email Settings:');
    console.log('Host:', emailSettings.host);
    console.log('Port:', emailSettings.port);
    console.log('SMTP User:', emailSettings.auth?.user);
    console.log('Current Sender:', emailSettings.from?.address);
    console.log('Sender Name:', emailSettings.from?.name);
    
    // IONOS Policy Information
    console.log('\n🚨 IONOS Policy Change (January 29, 2024):');
    console.log('- Sender address MUST belong to a domain in your IONOS contract');
    console.log('- Current sender:', emailSettings.from?.address);
    console.log('- SMTP User:', emailSettings.auth?.user);
    
    // Check if sender domain matches SMTP user domain
    const senderDomain = emailSettings.from?.address?.split('@')[1];
    const smtpUserDomain = emailSettings.auth?.user?.split('@')[1];
    
    console.log('\n🔍 Domain Analysis:');
    console.log('Sender Domain:', senderDomain);
    console.log('SMTP User Domain:', smtpUserDomain);
    
    if (senderDomain !== smtpUserDomain) {
      console.log('\n❌ PROBLEM IDENTIFIED:');
      console.log('The sender domain does not match the SMTP user domain.');
      console.log('This violates IONOS\'s new policy and causes "Sender address is not allowed" error.');
      
      console.log('\n💡 SOLUTION:');
      console.log('You need to either:');
      console.log('1. Change the sender address to use the same domain as your SMTP user');
      console.log('2. Create a new email address in your IONOS account with the desired domain');
      
      // Suggest a fix
      const suggestedSender = emailSettings.auth?.user;
      if (suggestedSender) {
        console.log('\n🔧 Suggested Fix:');
        console.log(`Change sender from: ${emailSettings.from?.address}`);
        console.log(`Change sender to: ${suggestedSender}`);
        
        // Ask if user wants to apply the fix
        console.log('\n⚠️  To apply this fix automatically, run:');
        console.log('node apply_ionos_fix.js');
      }
    } else {
      console.log('\n✅ Domains match - this should work with IONOS policy');
      console.log('The issue might be elsewhere. Check:');
      console.log('1. SMTP credentials are correct');
      console.log('2. The email address exists in your IONOS account');
      console.log('3. The domain is properly configured in IONOS');
    }
    
  } catch (error) {
    console.error('❌ Error checking email settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

fixIONOSSender();