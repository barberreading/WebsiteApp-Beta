const mongoose = require('mongoose');

const BrandingConfigSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'Booking System'
  },
  logo: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#3f51b5'
  },
  secondaryColor: {
    type: String,
    default: '#f50057'
  },
  emailHeader: {
    type: String,
    default: ''
  },
  emailFooter: {
    type: String,
    default: ''
  },
  emailSignature: {
    type: String,
    default: 'Thank you for choosing our services!'
  },
  favicon: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
BrandingConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BrandingConfig', BrandingConfigSchema);