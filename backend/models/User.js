const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['superuser', 'manager', 'staff', 'client'],
    default: 'staff'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  address: {
    street: String,
    city: String,
    postcode: String,
    country: { type: String, default: 'UK' }
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  postcode: {
    type: String,
    trim: true,
    maxlength: [10, 'Postcode cannot be more than 10 characters']
  },
  locationArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocationArea'
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  dailyBookingLimit: {
    type: Number,
    default: 10
  },
  gdprConsent: {
    given: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  dataRequests: [{
    type: {
      type: String,
      enum: ['access', 'deletion'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    completionDate: Date
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isTemporaryPassword: {
    type: Boolean,
    default: false
  },
  photo: {
    type: String,
    default: ''
  },
  documentSharing: {
    shareProfile: {
      type: Boolean,
      default: true
    },
    shareDBS: {
      type: Boolean,
      default: true
    },
    shareRiskAssessment: {
      type: Boolean,
      default: true
    }
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('Comparing passwords...');
    console.log('Entered password length:', enteredPassword.length);
    console.log('Stored password hash:', this.password);
    
    // Force string conversion to handle any type issues
    const passwordString = String(enteredPassword);
    const isMatch = await bcrypt.compare(passwordString, this.password);
    
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema);