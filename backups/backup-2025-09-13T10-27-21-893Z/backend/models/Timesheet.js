const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BreakSchema = new Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  autoCalculated: {
    type: Boolean,
    default: false
  }
});

const TimesheetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  managerOverride: {
    type: Boolean,
    default: false
  },
  overriddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  overriddenAt: {
    type: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  breaks: [BreakSchema],
  totalHours: {
    type: Number, // Total hours worked (excluding breaks)
    required: true
  },
  breakDuration: {
    type: Number, // Break duration in minutes
    default: 0
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'submitted', 'pending_manager_approval'],
    default: 'pending'
  },
  managerOverride: {
    type: Boolean,
    default: false
  },
  overriddenBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  overriddenAt: {
    type: Date
  },
  needsReview: {
    type: Boolean,
    default: false
  },
  manuallyEntered: {
    type: Boolean,
    default: false
  },
  enteredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  scannedFile: {
    type: String
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  managerApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  managerApprovedAt: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  approvalRequestSent: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  editHistory: [{
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editedAt: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    changes: {
      type: Object,
      required: true
    }
  }]
});

// Calculate total hours worked (excluding breaks)
TimesheetSchema.pre('save', function(next) {
  // Calculate total shift duration in milliseconds
  const shiftDuration = this.endTime - this.startTime;
  
  // Calculate total break duration in milliseconds
  let breakDuration = 0;
  if (this.breaks && this.breaks.length > 0) {
    breakDuration = this.breaks.reduce((total, breakItem) => {
      return total + (breakItem.endTime - breakItem.startTime);
    }, 0);
  }
  
  // Calculate total worked hours (shift duration minus breaks)
  const workedDuration = shiftDuration - breakDuration;
  this.totalHours = parseFloat((workedDuration / (1000 * 60 * 60)).toFixed(2)); // Convert to hours with 2 decimal places
  
  next();
});

module.exports = mongoose.model('Timesheet', TimesheetSchema);