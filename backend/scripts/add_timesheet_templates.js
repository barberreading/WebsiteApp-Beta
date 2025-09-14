/**
 * Script to add timesheet email templates to the database
 * Run with: node scripts/add_timesheet_templates.js
 */

const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.log('MongoDB Connected'))
.catch(err => {
  logger.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Define the email templates
const timesheetTemplates = [
  {
    name: 'timesheet_missing_reminder',
    description: 'Reminder sent to staff for missing timesheets',
    subject: 'Missing Timesheet Reminder',
    body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #333;">Missing Timesheet Reminder</h2>
      <p>Hello {{staffName}},</p>
      <p>Our records show that you have not submitted timesheets for the following bookings:</p>
      
      {{#each clientGroups}}
      <div style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #444;">{{clientName}}</h3>
        <ul style="padding-left: 20px;">
          {{#each dates}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>
      {{/each}}
      
      <p>Please submit your timesheets as soon as possible. Timely submission ensures prompt payment processing.</p>
      <p>You can submit your timesheets by logging into the staff portal and navigating to the Timesheets section.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>If you believe you have received this email in error, please contact your manager.</p>
      </div>
    </div>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Name of the staff member' },
      { name: 'clientGroups', description: 'Array of client groups with dates' }
    ]
  },
  {
    name: 'timesheet_approval_reminder',
    description: 'Reminder sent to clients for pending timesheet approvals',
    subject: 'Pending Timesheet Approvals',
    body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #333;">Pending Timesheet Approvals</h2>
      <p>Hello {{clientName}},</p>
      <p>You have {{count}} timesheet(s) pending your approval:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Staff</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Hours</th>
          </tr>
        </thead>
        <tbody>
          {{#each timesheets}}
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">{{staffName}}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{date}}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{hours}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      
      <p>Please review and approve these timesheets at your earliest convenience. Prompt approval ensures timely payment processing for our staff.</p>
      <p>You can approve timesheets by clicking on the approval links sent to you previously or by logging into the client portal.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>If you have any questions, please contact your account manager.</p>
      </div>
    </div>
    `,
    type: 'other',
    variables: [
      { name: 'clientName', description: 'Name of the client' },
      { name: 'count', description: 'Number of pending timesheets' },
      { name: 'timesheets', description: 'Array of timesheet details' }
    ]
  },
  {
    name: 'timesheet_approved',
    description: 'Notification sent to staff when their timesheet is approved',
    subject: 'Timesheet Approved',
    body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #4CAF50;">Timesheet Approved</h2>
      <p>Hello {{staffName}},</p>
      <p>Your timesheet has been approved:</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Hours:</strong> {{hours}}</p>
        <p><strong>Approved via:</strong> {{approvalType}}</p>
      </div>
      
      <p>This timesheet will be processed for payment according to our standard payment schedule.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>If you have any questions about your payment, please contact your manager.</p>
      </div>
    </div>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Name of the staff member' },
      { name: 'date', description: 'Date of the timesheet' },
      { name: 'clientName', description: 'Name of the client' },
      { name: 'hours', description: 'Hours worked' },
      { name: 'approvalType', description: 'How the timesheet was approved' }
    ]
  },
  {
    name: 'timesheet_pending_approval',
    description: 'Notification sent to staff about timesheets awaiting approval',
    subject: 'Timesheet Awaiting Approval',
    body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #FF9800;">Timesheet Awaiting Approval</h2>
      <p>Hello {{staffName}},</p>
      <p>Your timesheet is currently awaiting client approval:</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Hours:</strong> {{hours}}</p>
        <p><strong>Submitted:</strong> {{submittedDate}}</p>
      </div>
      
      <p>The client has been notified to review and approve this timesheet. We will update you once it has been approved.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>If you have any questions, please contact your manager.</p>
      </div>
    </div>
    `,
    type: 'other',
    variables: [
      { name: 'staffName', description: 'Name of the staff member' },
      { name: 'date', description: 'Date of the timesheet' },
      { name: 'clientName', description: 'Name of the client' },
      { name: 'hours', description: 'Hours worked' },
      { name: 'submittedDate', description: 'Date the timesheet was submitted' }
    ]
  },
  {
    name: 'manager_pending_approvals',
    description: 'Notification sent to managers about all pending timesheet approvals',
    subject: 'Pending Timesheet Approvals Summary',
    body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #333;">Pending Timesheet Approvals Summary</h2>
      <p>Hello {{managerName}},</p>
      <p>There are currently {{count}} timesheet(s) pending client approval:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Staff</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Client</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Hours</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Pending Since</th>
          </tr>
        </thead>
        <tbody>
          {{#each timesheets}}
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">{{staffName}}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{clientName}}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{date}}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{hours}}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{pendingSince}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      
      <p>You can review and override these approvals if necessary by visiting the <a href="{{dashboardUrl}}" style="color: #007bff; text-decoration: none;">Timesheet Approval Dashboard</a>.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated summary sent weekly.</p>
      </div>
    </div>
    `,
    type: 'other',
    variables: [
      { name: 'managerName', description: 'Name of the manager' },
      { name: 'count', description: 'Number of pending timesheets' },
      { name: 'timesheets', description: 'Array of timesheet details' },
      { name: 'dashboardUrl', description: 'URL to the timesheet approval dashboard' }
    ]
  }
];

// Function to add templates
const addTemplates = async () => {
  try {
    for (const template of timesheetTemplates) {
      // Check if template already exists
      const existingTemplate = await EmailTemplate.findOne({ name: template.name });
      
      if (existingTemplate) {
        logger.log(`Template "${template.name}" already exists. Updating...`);
        await EmailTemplate.findOneAndUpdate({ name: template.name }, template);
      } else {
        logger.log(`Creating new template: "${template.name}"`);
        await EmailTemplate.create(template);
      }
    }
    
    logger.log('All timesheet email templates have been added/updated successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error adding email templates:', error);
    process.exit(1);
  }
};

// Run the function
addTemplates();