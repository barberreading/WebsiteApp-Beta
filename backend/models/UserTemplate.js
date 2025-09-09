const mongoose = require('mongoose');

const UserTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['staff', 'manager', 'admin', 'client'],
    default: 'staff'
  },
  services: [{
    type: String
  }],
  workingHours: {
    monday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: true 
      } 
    },
    tuesday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: true 
      } 
    },
    wednesday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: true 
      } 
    },
    thursday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: true 
      } 
    },
    friday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: true 
      } 
    },
    saturday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: false 
      } 
    },
    sunday: { 
      start: String, 
      end: String, 
      available: { 
        type: Boolean, 
        default: false 
      } 
    }
  },
  rooms: [{
    type: String
  }],
  location: {
    type: String,
    trim: true
  },
  permissions: {
    dashboard: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    },
    calendar: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    },
    bookings: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    },
    clients: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    },
    services: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    },
    userManagement: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    },
    resourcesManagement: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    },
    staffHR: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    },
    timesheets: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      hidden: { type: Boolean, default: false }
    },
    leaveRequests: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      hidden: { type: Boolean, default: false }
    },
    reports: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    },
    settings: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    },
    branding: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    },
    emailTemplates: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    },
    bulkImport: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      hidden: { type: Boolean, default: true }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserTemplate', UserTemplateSchema);