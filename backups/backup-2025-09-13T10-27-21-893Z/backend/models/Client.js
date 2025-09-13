const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  photo: {
    type: String
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    postcode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'UK'
    }
  },
  dateOfBirth: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  consultant: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  categoryKey: {
    type: String,
    trim: true
  },
  locationAreas: {
    type: [String],
    default: []
  },
  photo: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Client permissions for calendar and booking access
  permissions: {
    calendar: {
      viewOwnBookings: { type: Boolean, default: true },
      viewAllBookings: { type: Boolean, default: false },
      createBookings: { type: Boolean, default: true },
      editOwnBookings: { type: Boolean, default: true },
      editAllBookings: { type: Boolean, default: false },
      cancelOwnBookings: { type: Boolean, default: true },
      cancelAllBookings: { type: Boolean, default: false }
    },
    data: {
      viewOwnData: { type: Boolean, default: true },
      viewAllData: { type: Boolean, default: false },
      viewStaffData: { type: Boolean, default: false }
    }
  },
  isTestUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient searching
clientSchema.index({ email: 1 });
clientSchema.index({ name: 1, status: 1 });

// Virtual for isActive
clientSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);