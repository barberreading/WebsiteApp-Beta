const mongoose = require('mongoose');

const BookingAlertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an alert title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please add an end time']
  },
  // Multi-day booking support
  bookingDays: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  }],
  isMultiDay: {
    type: Boolean,
    default: false
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Please select a service']
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: [true, 'Please select a client']
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
  manager: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the manager who created this alert']
  },
  status: {
    type: String,
    enum: ['open', 'claimed', 'pending_confirmation', 'confirmed', 'cancelled'],
    default: 'open'
  },
  claimedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  rejectedStaff: [{
    staffId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String
    }
  }],
  rejectionReason: {
    type: String,
    default: null
  },
  bookingKey: {
    type: String,
    default: null
  },
  locationArea: {
    type: String,
    default: null
  },
  emailsSent: {
    type: Boolean,
    default: false
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BookingAlert', BookingAlertSchema);