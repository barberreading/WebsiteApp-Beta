const Booking = require('../../models/Booking');
const Client = require('../../models/Client');
const User = require('../../models/User');

const generateReport = async (reportType, startDate, endDate, includeNoClientBookings) => {
  let query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (!includeNoClientBookings) {
    query.client = { $ne: null };
  }

  switch (reportType) {
    case 'weekly':
    case 'monthly':
      return await generateSummaryReport(query);
    case 'staff':
      return await generateStaffPerformanceReport(query);
    case 'client':
      return await generateClientBookingsReport(query);
    case 'financial':
      return await generateFinancialSummaryReport(query);
    default:
      throw new Error('Invalid report type');
  }
};

const generateSummaryReport = async (query) => {
  const bookings = await Booking.find(query).populate('client staff');
  // Basic summary - can be expanded
  const totalBookings = bookings.length;
  const totalHours = bookings.reduce((acc, booking) => acc + (booking.duration || 0), 0);
  return { totalBookings, totalHours, bookings };
};

const generateStaffPerformanceReport = async (query) => {
  const staffPerformance = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$staff',
        totalBookings: { $sum: 1 },
        totalHours: { $sum: '$duration' }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);

  await User.populate(staffPerformance, { path: '_id', select: 'firstName lastName' });
  return staffPerformance;
};

const generateClientBookingsReport = async (query) => {
  const clientBookings = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$client',
        totalBookings: { $sum: 1 },
        totalHours: { $sum: '$duration' }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);

  await Client.populate(clientBookings, { path: '_id', select: 'name' });
  return clientBookings;
};

const generateFinancialSummaryReport = async (query) => {
  // This is a placeholder. Financial data is not available in the Booking model.
  // You would need to add fields like 'cost' or 'price' to the Booking model.
  return { message: 'Financial report not yet implemented. Requires pricing data in bookings.' };
};

module.exports = { generateReport };