const User = require('../../models/User');
const Booking = require('../../models/Booking');

exports.searchStaffByDistance = async (query) => {
  const { 
    longitude, 
    latitude, 
    bookingDate,
    startTime,
    endTime
  } = query;
  
  if (!longitude || !latitude) {
    throw new Error('Please provide longitude and latitude coordinates');
  }
  
  const staff = await User.find({
    role: 'staff',
    'location.type': 'Point',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
      }
    }
  }).select('name email phone address location');
  
  if (bookingDate && startTime && endTime) {
    const bookingStartTime = new Date(`${bookingDate}T${startTime}`);
    const bookingEndTime = new Date(`${bookingDate}T${endTime}`);
    
    const staffIds = staff.map(s => s._id);
    
    const overlappingBookings = await Booking.find({
      staff: { $in: staffIds },
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $gte: bookingStartTime, $lt: bookingEndTime }
        },
        {
          endTime: { $gt: bookingStartTime, $lte: bookingEndTime }
        },
        {
          startTime: { $lte: bookingStartTime },
          endTime: { $gte: bookingEndTime }
        }
      ]
    }).select('staff');
    
    const unavailableStaffIds = overlappingBookings.map(booking => booking.staff.toString());
    
    const availableStaff = staff.filter(s => !unavailableStaffIds.includes(s._id.toString()));
    
    return availableStaff;
  }
  
  return staff;
};

exports.updateStaffLocation = async (userId, user, body) => {
  const { longitude, latitude } = body;

  if (userId !== user.id && user.role !== 'manager' && user.role !== 'superuser') {
    throw new Error('Not authorized to update this user\'s location');
  }

  if (!longitude || !latitude) {
    throw new Error('Please provide longitude and latitude coordinates');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId || user.id,
    {
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    },
    { new: true, runValidators: true }
  ).select('name email location');

  if (!updatedUser) {
    throw new Error('User not found');
  }

  return updatedUser;
};