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

const applyIONOSFix = async () => {
  await connectDB();
  
  try {
    // Get current email settings
    const emailSettings = await mongoose.connection.db.collection('emailsettings').findOne({});
    
    if (!emailSettings) {
      logger.log('❌ No email settings found in database');
      return;
    }
    
    logger.log('📧 Current Email Settings:');
    logger.log('Current Sender:', emailSettings.from?.address);
    logger.log('SMTP User:', emailSettings.auth?.user);
    
    // Check if fix is needed
    const senderDomain = emailSettings.from?.address?.split('@')[1];
    const smtpUserDomain = emailSettings.auth?.user?.split('@')[1];
    
    if (senderDomain === smtpUserDomain) {
      logger.log('\n✅ No fix needed - domains already match');
      return;
    }
    
    // Apply the fix
    const newSenderAddress = emailSettings.auth?.user;
    
    if (!newSenderAddress) {
      logger.log('❌ Cannot determine new sender address - SMTP user not found');
      return;
    }
    
    logger.log('\n🔧 Applying IONOS Policy Fix:');
    logger.log(`Changing sender from: ${emailSettings.from?.address}`);
    logger.log(`Changing sender to: ${newSenderAddress}`);
    
    // Update the email settings
    const updateResult = await mongoose.connection.db.collection('emailsettings').updateOne(
      { _id: emailSettings._id },
      {
        $set: {
          'from.address': newSenderAddress
        }
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      logger.log('\n✅ Email settings updated successfully!');
      logger.log('\n📝 Summary of changes:');
      logger.log(`- Sender address changed to: ${newSenderAddress}`);
      logger.log('- This should resolve the "Sender address is not allowed" error');
      logger.log('- The sender address now matches your SMTP authentication user');
      
      logger.log('\n🧪 Next steps:');
      logger.log('1. Test email sending with: node test_email.js');
      logger.log('2. If successful, try creating a booking to test the full flow');
      
    } else {
      logger.log('❌ Failed to update email settings');
    }
    
  } catch (error) {
    logger.error('❌ Error applying fix:', error);
  } finally {
    await mongoose.disconnect();
    logger.log('\n🔌 Disconnected from MongoDB');
  }
};

applyIONOSFix();