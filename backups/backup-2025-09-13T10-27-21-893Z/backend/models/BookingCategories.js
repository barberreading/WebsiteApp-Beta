const mongoose = require('mongoose');

const BookingKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a key name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LocationAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an area name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BookingKey = mongoose.model('BookingKey', BookingKeySchema);
const LocationArea = mongoose.model('LocationArea', LocationAreaSchema);

module.exports = { BookingKey, LocationArea };