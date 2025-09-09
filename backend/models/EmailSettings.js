const mongoose = require('mongoose');

const EmailSettingsSchema = new mongoose.Schema({
  host: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    required: true
  },
  secure: {
    type: Boolean,
    default: true
  },
  auth: {
    user: {
      type: String,
      required: true,
      trim: true
    },
    pass: {
      type: String,
      required: true
    }
  },
  from: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    }
  },
  enabled: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('EmailSettings', EmailSettingsSchema);