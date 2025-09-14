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

const applyIONOSFix = async () => {
  await connectDB();
  
  try {
    // Get current email settings
    const emailSettings = await mongoose.connection.db.collection('emailsettings').findOne({});
    
    if (!emailSettings) {
      console.log('❌ No email settings found in database');
      return;
    }
    
    console.log('📧 Current Email Settings:');
    console.log('Current Sender:', emailSettings.from?.address);
    console.log('SMTP User:', emailSettings.auth?.user);
    
    // Check if fix is needed
    const senderDomain = emailSettings.from?.address?.split('@')[1];
    const smtpUserDomain = emailSettings.auth?.user?.split('@')[1];
    
    if (senderDomain === smtpUserDomain) {
      console.log('\n✅ No fix needed - domains already match');
      return;
    }
    
    // Apply the fix
    const newSenderAddress = emailSettings.auth?.user;
    
    if (!newSenderAddress) {
      console.log('❌ Cannot determine new sender address - SMTP user not found');
      return;
    }
    
    console.log('\n🔧 Applying IONOS Policy Fix:');
    console.log(`Changing sender from: ${emailSettings.from?.address}`);
    console.log(`Changing sender to: ${newSenderAddress}`);
    
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
      console.log('\n✅ Email settings updated successfully!');
      console.log('\n📝 Summary of changes:');
      console.log(`- Sender address changed to: ${newSenderAddress}`);
      console.log('- This should resolve the "Sender address is not allowed" error');
      console.log('- The sender address now matches your SMTP authentication user');
      
      console.log('\n🧪 Next steps:');
      console.log('1. Test email sending with: node test_email.js');
      console.log('2. If successful, try creating a booking to test the full flow');
      
    } else {
      console.log('❌ Failed to update email settings');
    }
    
  } catch (error) {
    console.error('❌ Error applying fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

applyIONOSFix();