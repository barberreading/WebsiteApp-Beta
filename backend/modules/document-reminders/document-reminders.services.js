const StaffDocument = require('../../models/StaffDocument');
const User = require('../../models/User');
const { sendEmail } = require('../email/email.services');

/**
 * Check for documents that need reminders sent
 */
const checkDocumentReminders = async () => {
  try {
    console.log('Checking for document reminders...');
    
    // Find documents that are expiring soon (within 30 days) and haven't had a reminder sent
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const documents = await StaffDocument.find({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      reminderSent: false
    }).populate('userId', 'name email');
    
    console.log(`Found ${documents.length} documents requiring reminders`);
    
    // Send reminders for each document
    for (const doc of documents) {
      if (!doc.userId) {
        console.log(`Document ${doc._id} has no associated user`);
        continue;
      }
      
      // Format expiry date
      const expiryDate = doc.expiryDate.toLocaleDateString();
      
      // Send email reminder
      await sendEmail({
        to: doc.userId.email,
        subject: 'Document Expiry Reminder',
        text: `Dear ${doc.userId.name},\n\nThis is a reminder that your document "${doc.title}" will expire on ${expiryDate}. Please update it before the expiry date.\n\nRegards,\nTimify Team`,
        html: `<p>Dear ${doc.userId.name},</p>
               <p>This is a reminder that your document <strong>"${doc.title}"</strong> will expire on <strong>${expiryDate}</strong>.</p>
               <p>Please update it before the expiry date.</p>
               <p>Regards,<br>Timify Team</p>`
      });
      
      // Mark reminder as sent
      doc.reminderSent = true;
      await doc.save();
      
      console.log(`Reminder sent for document ${doc._id} to ${doc.userId.email}`);
    }
    
    return { success: true, count: documents.length };
  } catch (error) {
    console.error('Error sending document reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset reminder flags for documents that are still valid but had reminders sent
 * This allows for new reminders to be sent if documents are still approaching expiry
 */
const resetReminderFlags = async () => {
  try {
    console.log('Resetting document reminder flags...');
    
    // Find documents that had reminders sent but are still valid (expiry date in the future)
    const result = await StaffDocument.updateMany(
      { 
        expiryDate: { $gt: new Date() },
        reminderSent: true
      },
      { 
        $set: { reminderSent: false } 
      }
    );
    
    console.log(`Reset reminder flags for ${result.modifiedCount} documents`);
    
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error('Error resetting document reminder flags:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  checkDocumentReminders,
  resetReminderFlags
};