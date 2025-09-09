const mongoose = require('mongoose');

const hrDocumentAccessSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessStartTime: {
    type: Date,
    required: true
  },
  accessEndTime: {
    type: Date,
    required: true
  },
  shiftStartTime: {
    type: Date,
    required: true
  },
  shiftEndTime: {
    type: Date,
    required: true
  },
  accessibleDocuments: [{
    documentType: {
      type: String,
      enum: ['contract', 'handbook', 'policies', 'training', 'certificates', 'all'],
      required: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffDocument'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
hrDocumentAccessSchema.index({ clientId: 1, bookingId: 1 });
hrDocumentAccessSchema.index({ accessStartTime: 1, accessEndTime: 1 });
hrDocumentAccessSchema.index({ isActive: 1 });

// Method to check if access is currently valid
hrDocumentAccessSchema.methods.isCurrentlyAccessible = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.accessStartTime && 
         now <= this.accessEndTime;
};

// Static method to find active access for a client
hrDocumentAccessSchema.statics.findActiveAccessForClient = function(clientId) {
  const now = new Date();
  return this.find({
    clientId: clientId,
    isActive: true,
    accessStartTime: { $lte: now },
    accessEndTime: { $gte: now }
  }).populate('bookingId staffId');
};

// Static method to create access window for booking
hrDocumentAccessSchema.statics.createAccessForBooking = async function(bookingId, windowHours = 48) {
  const Booking = mongoose.model('Booking');
  const booking = await Booking.findById(bookingId).populate('clientId staffId');
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  const shiftStart = new Date(booking.startTime);
  const shiftEnd = new Date(booking.endTime);
  const windowMs = windowHours * 60 * 60 * 1000; // Convert hours to milliseconds
  
  const accessStart = new Date(shiftStart.getTime() - windowMs);
  const accessEnd = new Date(shiftEnd.getTime() + windowMs);
  
  // Check if access already exists for this booking
  const existingAccess = await this.findOne({
    clientId: booking.clientId,
    bookingId: bookingId,
    isActive: true
  });
  
  if (existingAccess) {
    // Update existing access window if needed
    existingAccess.accessStartTime = new Date(Math.min(existingAccess.accessStartTime, accessStart));
    existingAccess.accessEndTime = new Date(Math.max(existingAccess.accessEndTime, accessEnd));
    return await existingAccess.save();
  }
  
  // Create new access record
  return await this.create({
    clientId: booking.clientId,
    bookingId: bookingId,
    staffId: booking.staffId,
    accessStartTime: accessStart,
    accessEndTime: accessEnd,
    shiftStartTime: shiftStart,
    shiftEndTime: shiftEnd,
    accessibleDocuments: [{ documentType: 'all' }],
    isActive: true
  });
};

module.exports = mongoose.model('HRDocumentAccess', hrDocumentAccessSchema);