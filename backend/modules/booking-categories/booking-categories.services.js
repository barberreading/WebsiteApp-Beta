const { BookingKey, LocationArea } = require('../../models/BookingCategories');
const ErrorResponse = require('../../utils/errorResponse');

exports.getBookingKeys = async () => {
  return await BookingKey.find().sort('name');
};

exports.createBookingKey = async (data) => {
  try {
    return await BookingKey.create(data);
  } catch (err) {
    if (err.code === 11000) {
      throw new ErrorResponse('A booking key with this name already exists', 400);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      throw new ErrorResponse(messages, 400);
    }
    throw err;
  }
};

exports.updateBookingKey = async (id, data) => {
  let bookingKey = await BookingKey.findById(id);
  if (!bookingKey) {
    throw new ErrorResponse('Booking key not found', 404);
  }
  try {
    return await BookingKey.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  } catch (err) {
    if (err.code === 11000) {
      throw new ErrorResponse('A booking key with this name already exists', 400);
    }
    throw err;
  }
};

exports.deleteBookingKey = async (id) => {
  const bookingKey = await BookingKey.findById(id);
  if (!bookingKey) {
    throw new ErrorResponse('Booking key not found', 404);
  }
  await bookingKey.remove();
};

exports.getLocationAreas = async () => {
  return await LocationArea.find().sort('name');
};

exports.createLocationArea = async (data) => {
  try {
    return await LocationArea.create(data);
  } catch (err) {
    if (err.code === 11000) {
      throw new ErrorResponse('A location area with this name already exists', 400);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      throw new ErrorResponse(messages, 400);
    }
    throw err;
  }
};

exports.updateLocationArea = async (id, data) => {
  let locationArea = await LocationArea.findById(id);
  if (!locationArea) {
    throw new ErrorResponse('Location area not found', 404);
  }
  try {
    return await LocationArea.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  } catch (err) {
    if (err.code === 11000) {
      throw new ErrorResponse('A location area with this name already exists', 400);
    }
    throw err;
  }
};

exports.deleteLocationArea = async (id) => {
  const locationArea = await LocationArea.findById(id);
  if (!locationArea) {
    throw new ErrorResponse('Location area not found', 404);
  }
  await locationArea.remove();
};