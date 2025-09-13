const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Email templates
const emailTemplates = [
  // 0. Shift Rejection
  {
    name: 'Shift Rejection',
    description: 'Sent to staff when a shift alert is rejected by the manager',
    subject: 'Shift Alert Rejection Notification',
    body: `
      <h2>Shift Alert Rejection</h2>
      <p>Dear {{staffName}},</p>
      <p>We regret to inform you that your shift alert has been rejected by the manager. Here are the details of the rejected shift:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date and Time:</strong> {{shiftDate}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p><strong>Rejection Reason:</strong> {{rejectionReason}}</p>
      </div>
      <p>If you have any questions regarding this decision, please contact your manager directly.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>Management Team</p>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the service' },
      { name: 'shiftDate', description: 'Date and time of the shift' },
      { name: 'location', description: 'Location of the shift' },
      { name: 'rejectionReason', description: 'Reason for rejection provided by the manager' }
    ]
  },
  
  // 1. Booking Confirmation
  {
    name: 'Booking Confirmation',
    description: 'Sent to clients when a booking is confirmed',
    subject: 'Your Booking Confirmation',
    body: `
      <h2>Booking Confirmation</h2>
      <p>Dear {{clientName}},</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date and Time:</strong> {{bookingDate}}</p>
        <p><strong>Staff Member:</strong> {{staffName}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p><strong>Notes:</strong> {{notes}}</p>
      </div>
      <p>If you need to make any changes to your booking, please contact us as soon as possible.</p>
      <p>Thank you for choosing our services.</p>
      <p>Best regards,<br>The Team</p>
    `,
    type: 'booking_confirmation',
    variables: [
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the booked service' },
      { name: 'bookingDate', description: 'Date and time of the booking' },
      { name: 'staffName', description: 'Name of the assigned staff member' },
      { name: 'location', description: 'Location of the booking' },
      { name: 'notes', description: 'Additional notes for the booking' }
    ]
  },
  
  // 2. Booking Reminder
  {
    name: 'Booking Reminder',
    description: 'Sent to clients as a reminder before their booking',
    subject: 'Reminder: Your Upcoming Booking',
    body: `
      <h2>Booking Reminder</h2>
      <p>Dear {{clientName}},</p>
      <p>This is a friendly reminder about your upcoming booking:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date and Time:</strong> {{bookingDate}}</p>
        <p><strong>Staff Member:</strong> {{staffName}}</p>
        <p><strong>Location:</strong> {{location}}</p>
      </div>
      <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
      <p>We look forward to seeing you!</p>
      <p>Best regards,<br>The Team</p>
    `,
    type: 'booking_reminder',
    variables: [
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the booked service' },
      { name: 'bookingDate', description: 'Date and time of the booking' },
      { name: 'staffName', description: 'Name of the assigned staff member' },
      { name: 'location', description: 'Location of the booking' }
    ]
  },
  
  // 3. Booking Alert
  {
    name: 'Booking Alert',
    description: 'Sent to staff when they are assigned to a booking',
    subject: 'New Booking Assignment',
    body: `
      <h2>New Booking Assignment</h2>
      <p>Dear {{staffName}},</p>
      <p>You have been assigned to a new booking. Here are the details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date and Time:</strong> {{bookingDate}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p><strong>Notes:</strong> {{notes}}</p>
      </div>
      <p>Please confirm your availability for this booking. If you have any conflicts, please notify management immediately.</p>
      <p>Thank you for your dedication.</p>
      <p>Best regards,<br>Management Team</p>
    `,
    type: 'booking_alert',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the booked service' },
      { name: 'bookingDate', description: 'Date and time of the booking' },
      { name: 'location', description: 'Location of the booking' },
      { name: 'notes', description: 'Additional notes for the booking' }
    ]
  },
  
  // 4. Leave Request
  {
    name: 'Leave Request Notification',
    description: 'Sent to managers when staff request leave',
    subject: 'New Leave Request',
    body: `
      <h2>Leave Request Notification</h2>
      <p>Dear Manager,</p>
      <p>A new leave request has been submitted:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Staff Member:</strong> {{staffName}}</p>
        <p><strong>Leave Type:</strong> {{leaveType}}</p>
        <p><strong>Start Date:</strong> {{startDate}}</p>
        <p><strong>End Date:</strong> {{endDate}}</p>
        <p><strong>Reason:</strong> {{reason}}</p>
      </div>
      <p>Please review this request and approve or reject it through the system.</p>
      <p>Best regards,<br>System Administrator</p>
    `,
    type: 'leave_request',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'leaveType', description: 'Type of leave requested' },
      { name: 'startDate', description: 'Start date of the leave' },
      { name: 'endDate', description: 'End date of the leave' },
      { name: 'reason', description: 'Reason for the leave request' }
    ]
  },
  
  // 5. Account Creation
  {
    name: 'Account Creation',
    description: 'Sent to users when their account is created',
    subject: 'Welcome to Our System',
    body: `
      <h2>Welcome to Our System</h2>
      <p>Dear {{userName}},</p>
      <p>Your account has been successfully created. Here are your account details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Username:</strong> {{username}}</p>
        <p><strong>Role:</strong> {{userRole}}</p>
      </div>
      <p>To set your password, please click on the link below:</p>
      <p><a href="{{passwordResetLink}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Set Your Password</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you have any questions, please contact the system administrator.</p>
      <p>Best regards,<br>System Administrator</p>
    `,
    type: 'account_creation',
    variables: [
      { name: 'userName', description: 'User\'s full name' },
      { name: 'username', description: 'User\'s username or email' },
      { name: 'userRole', description: 'User\'s role in the system' },
      { name: 'passwordResetLink', description: 'Link to set the password' }
    ]
  },
  
  // 6. Password Reset
  {
    name: 'Password Reset',
    description: 'Sent to users when they request a password reset',
    subject: 'Password Reset Request',
    body: `
      <h2>Password Reset Request</h2>
      <p>Dear {{userName}},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
      <p>To reset your password, please click on the link below:</p>
      <p><a href="{{passwordResetLink}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you have any questions, please contact the system administrator.</p>
      <p>Best regards,<br>System Administrator</p>
    `,
    type: 'password_reset',
    variables: [
      { name: 'userName', description: 'User\'s full name' },
      { name: 'passwordResetLink', description: 'Link to reset the password' }
    ]
  },
  
  // 7. Document Reminder
  {
    name: 'Document Reminder',
    description: 'Sent to staff when their documents are about to expire',
    subject: 'Document Expiry Reminder',
    body: `
      <h2>Document Expiry Reminder</h2>
      <p>Dear {{staffName}},</p>
      <p>This is a reminder that the following document is about to expire:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Document Type:</strong> {{documentType}}</p>
        <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
        <p><strong>Days Remaining:</strong> {{daysRemaining}}</p>
      </div>
      <p>Please update this document as soon as possible to maintain compliance.</p>
      <p>You can upload the updated document through the staff portal.</p>
      <p>Best regards,<br>Management Team</p>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'documentType', description: 'Type of document' },
      { name: 'expiryDate', description: 'Date when the document expires' },
      { name: 'daysRemaining', description: 'Number of days until expiry' }
    ]
  },
  
  // 8. Timesheet Reminder
  {
    name: 'Timesheet Reminder',
    description: 'Sent to staff to remind them to submit timesheets',
    subject: 'Timesheet Submission Reminder',
    body: `
      <h2>Timesheet Submission Reminder</h2>
      <p>Dear {{staffName}},</p>
      <p>This is a friendly reminder to submit your timesheet for the period:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Period:</strong> {{timesheetPeriod}}</p>
        <p><strong>Submission Deadline:</strong> {{submissionDeadline}}</p>
      </div>
      <p>Please ensure all your work hours are accurately recorded and submitted before the deadline.</p>
      <p>You can submit your timesheet through the staff portal.</p>
      <p>Best regards,<br>Management Team</p>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'timesheetPeriod', description: 'Period covered by the timesheet' },
      { name: 'submissionDeadline', description: 'Deadline for timesheet submission' }
    ]
  },
  
  // 9. Booking Cancellation
  {
    name: 'Booking Cancellation',
    description: 'Sent to clients when a booking is cancelled',
    subject: 'Booking Cancellation Notification',
    body: `
      <h2>Booking Cancellation</h2>
      <p>Dear {{clientName}},</p>
      <p>We regret to inform you that your booking has been cancelled. Here are the details of the cancelled booking:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date and Time:</strong> {{bookingDate}}</p>
        <p><strong>Staff Member:</strong> {{staffName}}</p>
        <p><strong>Cancellation Reason:</strong> {{cancellationReason}}</p>
      </div>
      <p>If you would like to reschedule, please contact us at your earliest convenience.</p>
      <p>We apologize for any inconvenience this may have caused.</p>
      <p>Best regards,<br>The Team</p>
    `,
    type: 'other',
    variables: [
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the cancelled service' },
      { name: 'bookingDate', description: 'Date and time of the cancelled booking' },
      { name: 'staffName', description: 'Name of the assigned staff member' },
      { name: 'cancellationReason', description: 'Reason for cancellation' }
    ]
  },
  
  // 10. Booking Rescheduled
  {
    name: 'Booking Rescheduled',
    description: 'Sent to clients when a booking is rescheduled',
    subject: 'Your Booking Has Been Rescheduled',
    body: `
      <h2>Booking Rescheduled</h2>
      <p>Dear {{clientName}},</p>
      <p>Your booking has been rescheduled. Here are the updated details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Previous Date and Time:</strong> {{previousDate}}</p>
        <p><strong>New Date and Time:</strong> {{newDate}}</p>
        <p><strong>Staff Member:</strong> {{staffName}}</p>
        <p><strong>Location:</strong> {{location}}</p>
      </div>
      <p>If this new time doesn't work for you, please contact us as soon as possible to make alternative arrangements.</p>
      <p>We apologize for any inconvenience and appreciate your understanding.</p>
      <p>Best regards,<br>The Team</p>
    `,
    type: 'other',
    variables: [
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the booked service' },
      { name: 'previousDate', description: 'Previous date and time of the booking' },
      { name: 'newDate', description: 'New date and time of the booking' },
      { name: 'staffName', description: 'Name of the assigned staff member' },
      { name: 'location', description: 'Location of the booking' }
    ]
  },
  
  // 11. Clock In Reminder
  {
    name: 'Clock In Reminder',
    description: 'Sent to staff to remind them to clock in for their shift',
    subject: 'Reminder: Clock In for Your Shift',
    body: `
      <h2>Clock In Reminder</h2>
      <p>Dear {{staffName}},</p>
      <p>This is a friendly reminder to clock in for your upcoming shift:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Shift Start Time:</strong> {{shiftStartTime}}</p>
        <p><strong>Location:</strong> {{location}}</p>
      </div>
      <p>Please remember to clock in using the mobile app or web portal when you arrive at the location.</p>
      <p>If you have any issues with clocking in, please contact your manager immediately.</p>
      <p>Best regards,<br>{{senderName}}</p>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the service' },
      { name: 'shiftStartTime', description: 'Start time of the shift' },
      { name: 'location', description: 'Location of the shift' },
      { name: 'senderName', description: 'Name of the sender (manager/system)' }
    ]
  },
  
  // 12. Clock Out Reminder
  {
    name: 'Clock Out Reminder',
    description: 'Sent to staff to remind them to clock out after their shift',
    subject: 'Reminder: Clock Out from Your Shift',
    body: `
      <h2>Clock Out Reminder</h2>
      <p>Dear {{staffName}},</p>
      <p>This is a friendly reminder to clock out from your current shift:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Shift End Time:</strong> {{shiftEndTime}}</p>
        <p><strong>Location:</strong> {{location}}</p>
      </div>
      <p>Please remember to clock out using the mobile app or web portal before you leave the location.</p>
      <p>If you have any issues with clocking out, please contact your manager immediately.</p>
      <p>Thank you for your work today!</p>
      <p>Best regards,<br>{{senderName}}</p>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'clientName', description: 'Client\'s full name' },
      { name: 'serviceName', description: 'Name of the service' },
      { name: 'shiftEndTime', description: 'End time of the shift' },
      { name: 'location', description: 'Location of the shift' },
      { name: 'senderName', description: 'Name of the sender (manager/system)' }
    ]
  },
  
  // 13. Timesheet Pending Approval
  {
    name: 'Timesheet Pending Approval',
    description: 'Sent to managers when a timesheet is submitted and pending approval',
    subject: 'Timesheet Pending Your Approval',
    body: `
      <h2>Timesheet Pending Approval</h2>
      <p>Dear {{managerName}},</p>
      <p>A timesheet has been submitted and is pending your approval:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Staff Member:</strong> {{staffName}}</p>
        <p><strong>Timesheet Period:</strong> {{timesheetPeriod}}</p>
        <p><strong>Total Hours:</strong> {{totalHours}}</p>
        <p><strong>Submission Date:</strong> {{submissionDate}}</p>
      </div>
      <p>Please review and approve or reject this timesheet at your earliest convenience.</p>
      <p>You can access the timesheet by clicking the button below:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="{{timesheetLink}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Review Timesheet</a>
      </p>
      <p>If you have any questions about this timesheet, please contact the staff member directly.</p>
      <p>Best regards,<br>{{senderName}}</p>
    `,
    type: 'other',
    variables: [
      { name: 'managerName', description: 'Manager\'s full name' },
      { name: 'staffName', description: 'Staff member\'s full name' },
      { name: 'timesheetPeriod', description: 'Period covered by the timesheet' },
      { name: 'totalHours', description: 'Total hours worked in the timesheet' },
      { name: 'submissionDate', description: 'Date when the timesheet was submitted' },
      { name: 'timesheetLink', description: 'Link to review the timesheet' },
      { name: 'senderName', description: 'Name of the sender (system/admin)' }
    ]
  }
];

// Function to add email templates
const addEmailTemplates = async () => {
  try {
    // Check if templates already exist
    const existingTemplates = await EmailTemplate.find();
    
    if (existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates.`);
      
      // Update existing templates
      for (const template of emailTemplates) {
        const existingTemplate = existingTemplates.find(t => t.type === template.type && t.name === template.name);
        
        if (existingTemplate) {
          console.log(`Updating template: ${template.name}`);
          await EmailTemplate.findByIdAndUpdate(existingTemplate._id, template);
        } else {
          console.log(`Adding new template: ${template.name}`);
          await EmailTemplate.create(template);
        }
      }
    } else {
      // Add all templates
      console.log('No existing templates found. Adding all templates...');
      await EmailTemplate.insertMany(emailTemplates);
    }
    
    console.log('Email templates added/updated successfully!');
  } catch (error) {
    console.error('Error adding email templates:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the function
addEmailTemplates();