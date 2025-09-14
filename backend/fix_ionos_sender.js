require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixIONOSSender = async () => {
  await connectDB();
  
  try {
    // Get current email settings
    const emailSettings = await mongoose.connection.db.collection('emailsettings').findOne({});
    
    if (!emailSettings) {
      logger.log('❌ No email settings found in database');
      return;
    }
    
    logger.log('📧 Current Email Settings:');
    logger.log('Host:', emailSettings.host);
    logger.log('Port:', emailSettings.port);
    logger.log('SMTP User:', emailSettings.auth?.user);
    logger.log('Current Sender:', emailSettings.from?.address);
    logger.log('Sender Name:', emailSettings.from?.name);
    
    // IONOS Policy Information
    logger.log('\n🚨 IONOS Policy Change (January 29, 2024):');
    logger.log('- Sender address MUST belong to a domain in your IONOS contract');
    logger.log('- Current sender:', emailSettings.from?.address);
    logger.log('- SMTP User:', emailSettings.auth?.user);
    
    // Check if sender domain matches SMTP user domain
    const senderDomain = emailSettings.from?.address?.split('@')[1];
    const smtpUserDomain = emailSettings.auth?.user?.split('@')[1];
    
    logger.log('\n🔍 Domain Analysis:');
    logger.log('Sender Domain:', senderDomain);
    logger.log('SMTP User Domain:', smtpUserDomain);
    
    if (senderDomain !== smtpUserDomain) {
      logger.log('\n❌ PROBLEM IDENTIFIED:');
      logger.log('The sender domain does not match the SMTP user domain.');
      logger.log('This violates IONOS\'s new policy and causes "Sender address is not allowed" error.');
      
      logger.log('\n💡 SOLUTION:');
      logger.log('You need to either:');
      logger.log('1. Change the sender address to use the same domain as your SMTP user');
      logger.log('2. Create a new email address in your IONOS account with the desired domain');
      
      // Suggest a fix
      const suggestedSender = emailSettings.auth?.user;
      if (suggestedSender) {
        logger.log('\n🔧 Suggested Fix:');
        logger.log(`Change sender from: ${emailSettings.from?.address}`);
        logger.log(`Change sender to: ${suggestedSender}`);
        
        // Ask if user wants to apply the fix
        logger.log('\n⚠️  To apply this fix automatically, run:');
        logger.log('node apply_ionos_fix.js');
      }
    } else {
      logger.log('\n✅ Domains match - this should work with IONOS policy');
      logger.log('The issue might be elsewhere. Check:');
      logger.log('1. SMTP credentials are correct');
      logger.log('2. The email address exists in your IONOS account');
      logger.log('3. The domain is properly configured in IONOS');
    }
    
  } catch (error) {
    logger.error('❌ Error checking email settings:', error);
  } finally {
    await mongoose.disconnect();
    logger.log('\n🔌 Disconnected from MongoDB');
  }
};

fixIONOSSender();