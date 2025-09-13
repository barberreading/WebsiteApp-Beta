const mongoose = require('mongoose');

// Predefined pastel color palette for services
const PREDEFINED_COLORS = [
  '#FFE5E5', // Light Pink
  '#E5E5FF', // Light Blue
  '#E5FFE5', // Light Green
  '#FFE5CC', // Light Orange
  '#F0E5FF', // Light Purple
  '#FFFFE5', // Light Yellow
  '#E5FFFF', // Light Cyan
  '#FFE5F0', // Light Rose
  '#F0FFE5', // Light Lime
  '#E5F0FF', // Light Indigo
  '#FFE5E0', // Light Coral
  '#E5F5FF'  // Light Sky Blue
];

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  bookingKey: {
    type: String,
    trim: true
  },
  locationArea: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#FFE5E5', // Default to first pastel color
    validate: {
      validator: function(v) {
        return PREDEFINED_COLORS.includes(v);
      },
      message: 'Color must be one of the predefined pastel colors'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dailyBookingLimit: {
    type: Number,
    default: 0, // 0 means no limit
    min: 0
  },
  price: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient searching
serviceSchema.index({ name: 1, isActive: 1 });
serviceSchema.index({ category: 1, isActive: 1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = {
  Service,
  PREDEFINED_COLORS
};