const Booking = require('../../models/Booking');
const User = require('../../models/User');
const { Service } = require('../../models/Service');
const ErrorResponse = require('../../utils/errorResponse');
const { getAuditTrailEntries } = require('../audit-trail/audit-trail.services.js');
const { createBookingCreatedEntry, createBookingUpdatedEntry, createBookingCancelledEntry } = require('../audit-trail/audit-trail.services.js');
const { sendBookingConfirmation, sendBookingUpdate, sendBookingCancellation } = require('../email/email.services.js');
const { createHRDocumentAccess } = require('../../utils/hrDocumentAccessManager');

const getBookings = async (user) => {
  let query = {};
  if (user.role === 'staff') {
    query.staff = user.id;
  } else if (user.role === 'client') {
    query.client = user.id;
  } else if (user.role === 'manager') {
    query.$or = [{ manager: user.id }, { createdBy: user.id }];
  }
  return Booking.find(query)
    .populate('service', 'name duration price color')
    .populate('staff', 'name email')
    .populate('client', 'name firstName lastName email phone address')
    .populate('manager', 'name email')
    .sort({ startTime: 1 });
};

const getBookingActivity = async (filters) => {
  const { startDate, endDate, activityType, search, page, limit } = filters;
  const queryFilters = {
    entityType: 'booking',
    startDate,
    endDate,
    search,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
  };

  if (activityType) {
    const actionMap = {
      'Booking Added': 'booking.created',
      'Booking Updated': 'booking.updated',
      'Booking Cancelled': 'booking.cancelled',
      'Booking Deleted': 'booking.deleted',
    };
    if (actionMap[activityType]) {
      queryFilters.action = actionMap[activityType];
    }
  }

  const { entries, pagination } = await getAuditTrailEntries(queryFilters);

  const formattedActivities = entries.map((entry) => ({
    _id: entry._id,
    activityType: entry.action ? entry.action.replace('booking.', 'Booking ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Unknown',
    formattedDate: new Date(entry.performedAt).toLocaleDateString(),
    formattedTime: new Date(entry.performedAt).toLocaleTimeString(),
    title: entry.title,
    description: entry.description,
    clientName: entry.details?.clientName,
    staffName: entry.details?.staffName,
    serviceName: entry.details?.serviceName,
    user: entry.performedBy ? { name: entry.performedBy.name } : { name: 'System' },
  }));

  return { activities: formattedActivities, pagination };
};

const getBookingsByRange = async (queryParams, user) => {
  const { startDate, endDate, page = 1, limit = 50, showCancelled, clientId, staffId } = queryParams;

  if (!startDate || !endDate) {
    throw new ErrorResponse('Start date and end date are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ErrorResponse('Invalid date format', 400);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const maxRangeMs = 14 * 24 * 60 * 60 * 1000;
  if (end - start > maxRangeMs) {
    end.setTime(start.getTime() + maxRangeMs);
  }

  let query = {
    startTime: { $gte: start, $lte: end },
  };

  if (showCancelled !== 'true') {
    query.status = { $ne: 'cancelled' };
  }

  if (user.role === 'staff') {
    query.staff = user.id;
  } else if (user.role === 'client') {
    query.client = user.id;
  } else if (user.role === 'manager' || user.role === 'superuser') {
    if (clientId) {
      query.client = clientId;
    }
    if (staffId) {
      query.staff = staffId;
    }
  }

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .select('startTime endTime service staff client status')
    .populate('service', 'name duration color')
    .populate('staff', 'name')
    .populate('client', 'name firstName lastName address')
    .sort({ startTime: 1 })
    .skip(skip)
    .limit(limitNum);

  return {
    bookings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
    },
  };
};

const getWeeklyBookings = async (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new ErrorResponse('Start date and end date are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ErrorResponse('Invalid date format', 400);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    startTime: { $gte: start, $lte: end },
  })
    .populate('client', 'name email phone')
    .populate('staff', 'name')
    .populate('service', 'name duration price color')
    .sort({ startTime: 1 });

  const bookingsByClient = {};

  bookings.forEach((booking) => {
    const clientId = booking.client._id.toString();
    const clientName = booking.client.name;

    if (!bookingsByClient[clientId]) {
      bookingsByClient[clientId] = {
        clientInfo: {
          id: clientId,
          name: clientName,
          email: booking.client.email,
          phone: booking.client.phone,
        },
        bookings: [],
      };
    }

    bookingsByClient[clientId].bookings.push({
      id: booking._id,
      title: booking.title,
      date: booking.startTime,
      startTime: booking.startTime,
      endTime: booking.endTime,
      staff: booking.staff.name,
      service: booking.service.name,
      duration: booking.service.duration,
      price: booking.service.price,
      status: booking.status,
      notes: booking.notes,
    });
  });

  return Object.values(bookingsByClient);
};

const getBookingById = async (id, user) => {
  const booking = await Booking.findById(id)
    .populate('service', 'name description duration price category color')
    .populate('staff', 'name email')
    .populate('client', 'name email phone address')
    .populate('manager', 'name email');

  if (!booking) {
    throw new ErrorResponse('Booking not found', 404);
  }

  if (
    user.role !== 'superuser' &&
    booking.staff?._id?.toString() !== user.id &&
    booking.client?._id?.toString() !== user.id &&
    booking.manager?._id?.toString() !== user.id
  ) {
    throw new ErrorResponse('Not authorized', 401);
  }

  return booking;
};

const createBooking = async (bookingData, user) => {
  const { service, staff, startTime, endTime, enforceServiceLimit, ...rest } = bookingData;

  if (!service || !staff || !startTime || !endTime) {
    throw new ErrorResponse('Please provide all required fields', 400);
  }

  const serviceData = await Service.findById(service);
  if (serviceData && serviceData.dailyBookingLimit > 0) {
    const bookingDate = new Date(startTime);
    bookingDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookingsCount = await Booking.countDocuments({
      service: service,
      startTime: { $gte: bookingDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    });

    if (bookingsCount >= serviceData.dailyBookingLimit) {
      throw new ErrorResponse('Daily booking limit reached for this service', 400, { limitReached: true });
    }
  }

  const existingBooking = await Booking.findOne({
    staff: staff,
    $or: [
      { startTime: { $lte: new Date(startTime) }, endTime: { $gt: new Date(startTime) } },
      { startTime: { $lt: new Date(endTime) }, endTime: { $gte: new Date(endTime) } },
      { startTime: { $gte: new Date(startTime) }, endTime: { $lte: new Date(endTime) } },
      { startTime: { $lte: new Date(startTime) }, endTime: { $gte: new Date(endTime) } },
    ],
    status: { $ne: 'cancelled' },
  });

  if (existingBooking) {
    throw new ErrorResponse('Staff member is already booked during this time period', 400, {
      conflict: {
        startTime: existingBooking.startTime,
        endTime: existingBooking.endTime,
        title: existingBooking.title,
      },
    });
  }

  const bookingDate = new Date(startTime);
  bookingDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(bookingDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingServiceBooking = await Booking.findOne({
    staff: staff,
    service: service,
    startTime: { $gte: bookingDate, $lt: nextDay },
    status: { $ne: 'cancelled' },
  });

  if (existingServiceBooking && enforceServiceLimit) {
    throw new ErrorResponse('Staff member is already booked for this service today', 400, {
      conflict: {
        startTime: existingServiceBooking.startTime,
        endTime: existingServiceBooking.endTime,
        title: existingServiceBooking.title,
      },
    });
  }

  const staffData = await User.findById(staff);
  if (staffData && staffData.dailyBookingLimit > 0) {
    const staffBookingsCount = await Booking.countDocuments({
      staff: staff,
      startTime: { $gte: bookingDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    });

    if (staffBookingsCount >= staffData.dailyBookingLimit) {
      throw new ErrorResponse('Daily booking limit reached for this staff member', 400, { staffLimitReached: true });
    }
  }

  const newBooking = new Booking({
    ...rest,
    service,
    staff,
    startTime,
    endTime,
    client: user.role === 'client' ? user.id : bookingData.client,
    manager: user.role === 'manager' ? user.id : null,
    status: bookingData.status || 'scheduled',
    createdBy: user.id,
  });

  const booking = await newBooking.save();

  try {
    const populatedBooking = await Booking.findById(booking._id).populate('client', 'name').populate('staff', 'name').populate('service', 'name');
    await createBookingCreatedEntry(populatedBooking, user, {});
  } catch (auditError) {
    console.error('Error creating audit trail entry for booking creation:', auditError);
  }

  try {
    const clientData = await User.findById(booking.client).select('name email phone');
    const staffDetails = await User.findById(booking.staff).select('name email');
    const serviceDetails = await Service.findById(booking.service).select('name duration category');

    if (clientData && clientData.email) {
      await sendBookingConfirmation(booking, clientData, staffDetails, serviceDetails);
    }
  } catch (emailError) {
    console.error('Error sending booking confirmation email:', emailError);
  }

  try {
    await createHRDocumentAccess(booking);
  } catch (hrAccessError) {
    console.error('Error creating HR document access:', hrAccessError);
  }

  return booking;
};

const updateBooking = async (id, bookingData, user) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new ErrorResponse('Booking not found', 404);
  }

  if (
    user.role !== 'superuser' &&
    booking.staff?.toString() !== user.id &&
    booking.client?.toString() !== user.id &&
    booking.manager?.toString() !== user.id
  ) {
    throw new ErrorResponse('Not authorized to update this booking', 401);
  }

  const oldStatus = booking.status;

  Object.assign(booking, bookingData);

  const updatedBooking = await booking.save();

  try {
    const populatedBooking = await Booking.findById(updatedBooking._id).populate('client', 'name').populate('staff', 'name').populate('service', 'name');
    await createBookingUpdatedEntry(populatedBooking, user, bookingData);
  } catch (auditError) {
    console.error('Error creating audit trail entry for booking update:', auditError);
  }

  if (bookingData.status && bookingData.status !== oldStatus) {
    try {
      const clientData = await User.findById(booking.client).select('name email');
      if (clientData && clientData.email) {
        if (bookingData.status === 'cancelled') {
          await sendBookingCancellation(booking, clientData);
        } else {
          await sendBookingUpdate(booking, clientData);
        }
      }
    } catch (emailError) {
      console.error('Error sending booking status update email:', emailError);
    }
  }

  return updatedBooking;
};

const deleteBooking = async (id, user) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new ErrorResponse('Booking not found', 404);
  }

  if (user.role !== 'superuser' && user.role !== 'manager') {
    throw new ErrorResponse('Not authorized to delete this booking', 401);
  }

  await Booking.findByIdAndDelete(id);

  return { msg: 'Booking deleted successfully' };
};

module.exports = {
  getBookings,
  getBookingActivity,
  getBookingsByRange,
  getWeeklyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
};