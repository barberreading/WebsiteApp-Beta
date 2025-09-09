const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the staff member']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for leave'],
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  denialReason: {
    type: String,
    default: null,
    maxlength: [500, 'Denial reason cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that leave request is at least one week in advance
LeaveRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    if (new Date(this.startDate) < oneWeekFromNow) {
      const error = new Error('Leave requests must be submitted at least one week in advance');
      return next(error);
    }
    
    // Check for overlapping leave requests for the same staff member
    const overlappingRequests = await this.constructor.find({
      staff: this.staff,
      _id: { $ne: this._id }, // Exclude current document if updating
      status: { $in: ['pending', 'approved'] }, // Only check pending and approved requests
      $or: [
        // New request starts during existing request
        {
          startDate: { $lte: this.startDate },
          endDate: { $gte: this.startDate }
        },
        // New request ends during existing request
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.endDate }
        },
        // New request completely contains existing request
        {
          startDate: { $gte: this.startDate },
          endDate: { $lte: this.endDate }
        }
      ]
    });
    
    if (overlappingRequests.length > 0) {
      const error = new Error('Leave request overlaps with existing leave request for the same staff member');
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);