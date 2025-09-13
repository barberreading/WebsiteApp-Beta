const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['booking_confirmation', 'booking_reminder', 'booking_alert', 'booking.updated', 'booking.cancelled', 'leave_request', 'account_creation', 'password_reset', 'other'],
    default: 'other'
  },
  variables: [{
    name: String,
    description: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);