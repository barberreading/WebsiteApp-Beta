const mongoose = require('mongoose');

const AuditTrailSchema = new mongoose.Schema({
  // The type of action performed
  action: {
    type: String,
    required: true,
    enum: ['booking.created', 'booking.updated', 'booking.cancelled', 'booking.deleted', 'staff.leave', 'timesheet.created', 'timesheet.updated']
  },
  
  // The entity that was affected (booking ID, timesheet ID, etc.)
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // The type of entity (booking, timesheet, etc.)
  entityType: {
    type: String,
    required: true,
    enum: ['booking', 'timesheet', 'leave_request']
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Title/summary of the action
  title: {
    type: String,
    required: true
  },
  
  // Detailed description of what happened
  description: {
    type: String,
    required: true
  },
  
  // Additional details specific to the action
  details: {
    clientName: String,
    staffName: String,
    serviceName: String,
    status: String,
    startTime: Date,
    endTime: Date,
    reason: String, // For cancellations, deletions, etc.
    previousValues: mongoose.Schema.Types.Mixed, // Store previous state for updates
    newValues: mongoose.Schema.Types.Mixed // Store new state for updates
  },
  
  // IP address of the user who performed the action
  ipAddress: String,
  
  // User agent of the browser/client
  userAgent: String,
  
  // Timestamp when the action was performed (this is the key fix)
  performedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // This adds createdAt and updatedAt
});

// Index for efficient querying
AuditTrailSchema.index({ performedAt: 1 }, { expireAfterSeconds: 7776000 });
AuditTrailSchema.index({ action: 1, performedAt: -1 });
AuditTrailSchema.index({ entityId: 1, entityType: 1 });
AuditTrailSchema.index({ performedBy: 1, performedAt: -1 });

module.exports = mongoose.model('AuditTrail', AuditTrailSchema);