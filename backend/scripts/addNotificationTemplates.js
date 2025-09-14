const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const templates = [
  {
    name: 'Booking Update Notification',
    description: 'Email sent to client and staff when a booking is updated',
    subject: 'Your booking has been updated',
    body: `
      <h2>Booking Update</h2>
      <p>Hello {{clientName}},</p>
      <p>Your booking has been updated with the following details:</p>
      <ul>
        <li><strong>Service:</strong> {{serviceName}}</li>
        <li><strong>Staff:</strong> {{staffName}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Time:</strong> {{time}}</li>
        <li><strong>Status:</strong> {{status}}</li>
      </ul>
      <p>If you have any questions, please contact us.</p>
      <p>Thank you for choosing our services!</p>
    `,
    type: 'booking.updated',
    variables: [
      { name: 'clientName', description: 'Client name' },
      { name: 'staffName', description: 'Staff name' },
      { name: 'serviceName', description: 'Service name' },
      { name: 'date', description: 'Booking date' },
      { name: 'time', description: 'Booking time' },
      { name: 'status', description: 'Booking status' }
    ]
  },
  {
    name: 'Booking Cancellation Notification',
    description: 'Email sent to client and staff when a booking is cancelled',
    subject: 'Your booking has been cancelled',
    body: `
      <h2>Booking Cancellation</h2>
      <p>Hello {{clientName}},</p>
      <p>Your booking has been cancelled:</p>
      <ul>
        <li><strong>Service:</strong> {{serviceName}}</li>
        <li><strong>Staff:</strong> {{staffName}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Time:</strong> {{time}}</li>
      </ul>
      <p>If you have any questions, please contact us.</p>
      <p>Thank you for choosing our services!</p>
    `,
    type: 'booking.cancelled',
    variables: [
      { name: 'clientName', description: 'Client name' },
      { name: 'staffName', description: 'Staff name' },
      { name: 'serviceName', description: 'Service name' },
      { name: 'date', description: 'Booking date' },
      { name: 'time', description: 'Booking time' }
    ]
  }
];

const addTemplates = async () => {
  try {
    for (const template of templates) {
      // Check if template already exists
      const existingTemplate = await EmailTemplate.findOne({ type: template.type });
      
      if (existingTemplate) {
        logger.log(`Template ${template.type} already exists, updating...`);
        await EmailTemplate.findByIdAndUpdate(existingTemplate._id, template);
      } else {
        logger.log(`Adding new template: ${template.type}`);
        await EmailTemplate.create(template);
      }
    }
    
    logger.log('All templates added/updated successfully!');
  } catch (error) {
    logger.error('Error adding templates:', error);
  } finally {
    mongoose.disconnect();
  }
};

addTemplates();