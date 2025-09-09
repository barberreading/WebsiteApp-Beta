const mongoose = require('mongoose');

const StaffDocumentSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['DBS', 'AgencyProfile', 'Qualification', 'FirstAid', 'Training', 'Other']
  },
  title: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  reminderDate: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessKey: {
    type: String
  },
  notes: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate a unique access key before saving
StaffDocumentSchema.pre('save', function(next) {
  if (!this.accessKey) {
    this.accessKey = mongoose.Types.ObjectId().toString();
  }
  next();
});

module.exports = mongoose.model('StaffDocument', StaffDocumentSchema);