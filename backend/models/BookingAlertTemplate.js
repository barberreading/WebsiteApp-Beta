const mongoose = require('mongoose');

const BookingAlertTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a template name'],
    trim: true,
    maxlength: [100, 'Template name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Template description cannot be more than 500 characters']
  },
  // Alert template fields
  title: {
    type: String,
    required: [true, 'Please add an alert title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  alertDescription: {
    type: String,
    maxlength: [500, 'Alert description cannot be more than 500 characters']
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Please select a service']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please add a location address']
    },
    city: String,
    postcode: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  locationArea: {
    type: String,
    default: null
  },
  // Targeting and notification preferences
  sendToAll: {
    type: Boolean,
    default: true
  },
  selectedLocationAreas: [{
    type: String
  }],
  sendAsNotification: {
    type: Boolean,
    default: true
  },
  sendAsEmail: {
    type: Boolean,
    default: true
  },
  // Template metadata
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who created this template']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
BookingAlertTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BookingAlertTemplate', BookingAlertTemplateSchema);