const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a booking title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please add an end time']
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Please select a service']
  },
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a staff member']
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client'
    // Made optional to allow HR bookings without clients
  },
  manager: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
    // Made optional to allow easier booking creation
  },
  location: {
    address: String,
    city: String,
    postcode: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  bookingKey: {
    type: String,
    default: null
  },
  seriesId: {
    type: String,
    default: null
  },
  locationArea: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  clockInTime: Date,
  clockOutTime: Date,
  hoursWorked: Number,
  confirmationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  hourReminderSent: {
    type: Boolean,
    default: false
  }
});

// Calculate hours worked when clock out time is updated
BookingSchema.pre('save', function(next) {
  if (this.clockInTime && this.clockOutTime) {
    const clockIn = new Date(this.clockInTime);
    const clockOut = new Date(this.clockOutTime);
    
    // Calculate hours worked (in hours)
    this.hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);