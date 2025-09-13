const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userRole: {
    type: String,
    default: null
  },
  url: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  componentStack: {
    type: String,
    default: null
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolution: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);