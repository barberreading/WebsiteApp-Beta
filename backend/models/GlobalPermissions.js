const mongoose = require('mongoose');

const globalPermissionsSchema = new mongoose.Schema({
  // Calendar permissions by role
  rolePermissions: {
    staff: {
      calendar: {
        viewOwnBookings: { type: Boolean, default: true },
        viewAllBookings: { type: Boolean, default: false },
        viewTeamBookings: { type: Boolean, default: false },
        createBookings: { type: Boolean, default: true },
        editOwnBookings: { type: Boolean, default: true },
        editAllBookings: { type: Boolean, default: false },
        cancelOwnBookings: { type: Boolean, default: true },
        cancelAllBookings: { type: Boolean, default: false }
      },
      data: {
        viewOwnData: { type: Boolean, default: true },
        viewAllData: { type: Boolean, default: false },
        viewClientData: { type: Boolean, default: false }
      }
    },
    manager: {
      calendar: {
        viewOwnBookings: { type: Boolean, default: true },
        viewAllBookings: { type: Boolean, default: true },
        viewTeamBookings: { type: Boolean, default: true },
        createBookings: { type: Boolean, default: true },
        editOwnBookings: { type: Boolean, default: true },
        editAllBookings: { type: Boolean, default: true },
        cancelOwnBookings: { type: Boolean, default: true },
        cancelAllBookings: { type: Boolean, default: true }
      },
      data: {
        viewOwnData: { type: Boolean, default: true },
        viewAllData: { type: Boolean, default: true },
        viewClientData: { type: Boolean, default: true }
      }
    },
    superuser: {
      calendar: {
        viewOwnBookings: { type: Boolean, default: true },
        viewAllBookings: { type: Boolean, default: true },
        viewTeamBookings: { type: Boolean, default: true },
        createBookings: { type: Boolean, default: true },
        editOwnBookings: { type: Boolean, default: true },
        editAllBookings: { type: Boolean, default: true },
        cancelOwnBookings: { type: Boolean, default: true },
        cancelAllBookings: { type: Boolean, default: true }
      },
      data: {
        viewOwnData: { type: Boolean, default: true },
        viewAllData: { type: Boolean, default: true },
        viewClientData: { type: Boolean, default: true }
      }
    },
    client: {
      calendar: {
        viewOwnBookings: { type: Boolean, default: true },
        viewAllBookings: { type: Boolean, default: false },
        viewTeamBookings: { type: Boolean, default: false },
        createBookings: { type: Boolean, default: true },
        editOwnBookings: { type: Boolean, default: true },
        editAllBookings: { type: Boolean, default: false },
        cancelOwnBookings: { type: Boolean, default: true },
        cancelAllBookings: { type: Boolean, default: false }
      },
      data: {
        viewOwnData: { type: Boolean, default: true },
        viewAllData: { type: Boolean, default: false },
        viewClientData: { type: Boolean, default: false }
      }
    }
  },
  // Default client permissions template
  defaultClientPermissions: {
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
  // Admin user groups
  adminUserGroups: {
    hrAdmins: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permissions: {
        manageStaffGallery: { type: Boolean, default: true },
        manageHRDocuments: { type: Boolean, default: true },
        configureDocumentAccess: { type: Boolean, default: true }
      }
    }],
    galleryAdmins: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permissions: {
        manageStaffGallery: { type: Boolean, default: true },
        manageHRDocuments: { type: Boolean, default: false },
        configureDocumentAccess: { type: Boolean, default: false }
      }
    }]
  },
  
  // HR Document Access Settings
  hrDocumentAccess: {
    enableTemporaryAccess: { type: Boolean, default: false },
    accessWindowHours: { type: Number, default: 48 }, // Hours before and after shift
    allowOverlappingAccess: { type: Boolean, default: true },
    requireActiveBooking: { type: Boolean, default: true },
    accessibleDocumentTypes: [{
      type: String,
      enum: ['contract', 'handbook', 'policies', 'training', 'certificates', 'all'],
      default: 'all'
    }]
  },
  
  // Staff Gallery Settings
  staffGalleryAccess: {
    // Client access settings
    client: {
      enabled: { type: Boolean, default: false },
      accessType: { 
        type: String, 
        enum: ['none', 'booked_only', 'all'], 
        default: 'booked_only' 
      },
      requireActiveBooking: { type: Boolean, default: true },
      timeLimitedAccess: { type: Boolean, default: true },
      accessWindowHours: { type: Number, default: 48 }, // Hours before/after booking
      showStaffProfiles: { type: Boolean, default: true },
      showStaffPhotos: { type: Boolean, default: true },
      showStaffQualifications: { type: Boolean, default: false },
      showContactInfo: { type: Boolean, default: false }
    },
    // Staff access settings
    staff: {
      enabled: { type: Boolean, default: true },
      accessType: { 
        type: String, 
        enum: ['none', 'own_only', 'all'], 
        default: 'own_only' 
      },
      timeLimitedAccess: { type: Boolean, default: false },
      showStaffProfiles: { type: Boolean, default: true },
      showStaffPhotos: { type: Boolean, default: true },
      showStaffQualifications: { type: Boolean, default: true },
      showContactInfo: { type: Boolean, default: true }
    },
    // Manager access settings
    manager: {
      enabled: { type: Boolean, default: true },
      accessType: { 
        type: String, 
        enum: ['none', 'team_only', 'all'], 
        default: 'all' 
      },
      timeLimitedAccess: { type: Boolean, default: false },
      showStaffProfiles: { type: Boolean, default: true },
      showStaffPhotos: { type: Boolean, default: true },
      showStaffQualifications: { type: Boolean, default: true },
      showContactInfo: { type: Boolean, default: true }
    },
    // Admin access settings
    admin: {
      enabled: { type: Boolean, default: true },
      accessType: { 
        type: String, 
        enum: ['none', 'all'], 
        default: 'all' 
      },
      timeLimitedAccess: { type: Boolean, default: false },
      showStaffProfiles: { type: Boolean, default: true },
      showStaffPhotos: { type: Boolean, default: true },
      showStaffQualifications: { type: Boolean, default: true },
      showContactInfo: { type: Boolean, default: true }
    },
    // Superuser access settings
    superuser: {
      enabled: { type: Boolean, default: true },
      accessType: { 
        type: String, 
        enum: ['none', 'all'], 
        default: 'all' 
      },
      timeLimitedAccess: { type: Boolean, default: false },
      showStaffProfiles: { type: Boolean, default: true },
      showStaffPhotos: { type: Boolean, default: true },
      showStaffQualifications: { type: Boolean, default: true },
      showContactInfo: { type: Boolean, default: true }
    }
  },
  
  // System settings
  settings: {
    enforceStrictPermissions: { type: Boolean, default: true },
    allowClientSelfRegistration: { type: Boolean, default: false },
    requireManagerApproval: { type: Boolean, default: true }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one global permissions document exists
globalPermissionsSchema.index({}, { unique: true });

module.exports = mongoose.model('GlobalPermissions', globalPermissionsSchema);