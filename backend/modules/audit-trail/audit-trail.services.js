const AuditTrail = require('../../models/AuditTrail');
const User = require('../../models/User');

const createAuditTrailEntry = async (params) => {
  try {
    const auditEntry = new AuditTrail({
      action: params.action,
      entityId: params.entityId,
      entityType: params.entityType,
      performedBy: params.performedBy,
      title: params.title,
      description: params.description,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      performedAt: params.performedAt || new Date(),
      metadata: params.metadata || {}
    });

    const savedEntry = await auditEntry.save();
    return savedEntry;
  } catch (error) {
    console.error('Error creating audit trail entry:', error);
    throw error;
  }
};

const createBookingCreatedEntry = async (booking, user, req) => {
  const clientName = booking.client ? 
    (typeof booking.client === 'object' ? booking.client.name : 'Unknown Client') : 
    'No Client';
  const staffName = booking.staff ? 
    (typeof booking.staff === 'object' ? booking.staff.name : 'Unknown Staff') : 
    'No Staff';
  const serviceName = booking.service ? 
    (typeof booking.service === 'object' ? booking.service.name : 'Unknown Service') : 
    'No Service';

  return await createAuditTrailEntry({
    action: 'booking.created',
    entityId: booking._id,
    entityType: 'booking',
    performedBy: user._id,
    title: `Booking Created: ${booking.title}`,
    description: `New booking created for ${clientName} with ${staffName}`,
    details: {
      clientName,
      staffName,
      serviceName,
      status: booking.status,
      startTime: booking.startTime,
      endTime: booking.endTime
    },
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent'),
    performedAt: booking.createdAt || new Date()
  });
};

const createBookingUpdatedEntry = async (oldBooking, newBooking, user, req) => {
  const clientName = newBooking.client ? 
    (typeof newBooking.client === 'object' ? newBooking.client.name : 'Unknown Client') : 
    'No Client';
  const staffName = newBooking.staff ? 
    (typeof newBooking.staff === 'object' ? newBooking.staff.name : 'Unknown Staff') : 
    'No Staff';
  const serviceName = newBooking.service ? 
    (typeof newBooking.service === 'object' ? newBooking.service.name : 'Unknown Service') : 
    'No Service';

  return await createAuditTrailEntry({
    action: 'booking.updated',
    entityId: newBooking._id,
    entityType: 'booking',
    performedBy: user._id,
    title: `Booking Updated: ${newBooking.title}`,
    description: `Booking updated for ${clientName} with ${staffName}`,
    details: {
      clientName,
      staffName,
      serviceName,
      status: newBooking.status,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      previousValues: {
        status: oldBooking.status,
        startTime: oldBooking.startTime,
        endTime: oldBooking.endTime,
        title: oldBooking.title
      },
      newValues: {
        status: newBooking.status,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        title: newBooking.title
      }
    },
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  });
};

const createBookingCancelledEntry = async (booking, user, req, reason = '') => {
  const clientName = booking.client ? 
    (typeof booking.client === 'object' ? booking.client.name : 'Unknown Client') : 
    'No Client';
  const staffName = booking.staff ? 
    (typeof booking.staff === 'object' ? booking.staff.name : 'Unknown Staff') : 
    'No Staff';
  const serviceName = booking.service ? 
    (typeof booking.service === 'object' ? booking.service.name : 'Unknown Service') : 
    'No Service';

  return await createAuditTrailEntry({
    action: 'booking.cancelled',
    entityId: booking._id,
    entityType: 'booking',
    performedBy: user._id,
    title: `Booking Cancelled: ${booking.title}`,
    description: `Booking cancelled for ${clientName} with ${staffName}${reason ? ` - Reason: ${reason}` : ''}`,
    details: {
      clientName,
      staffName,
      serviceName,
      status: 'cancelled',
      startTime: booking.startTime,
      endTime: booking.endTime,
      reason
    },
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  });
};

const createBookingDeletedEntry = async (booking, user, req, reason = '') => {
  const clientName = booking.client ? 
    (typeof booking.client === 'object' ? booking.client.name : 'Unknown Client') : 
    'No Client';
  const staffName = booking.staff ? 
    (typeof booking.staff === 'object' ? booking.staff.name : 'Unknown Staff') : 
    'No Staff';
  const serviceName = booking.service ? 
    (typeof booking.service === 'object' ? booking.service.name : 'Unknown Service') : 
    'No Service';

  return await createAuditTrailEntry({
    action: 'booking.deleted',
    entityId: booking._id,
    entityType: 'booking',
    performedBy: user._id,
    title: `Booking Deleted: ${booking.title}`,
    description: `Booking deleted for ${clientName} with ${staffName}${reason ? ` - Reason: ${reason}` : ''}`,
    details: {
      clientName,
      staffName,
      serviceName,
      status: booking.status,
      startTime: booking.startTime,
      endTime: booking.endTime,
      reason
    },
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  });
};

const getAuditTrailEntries = async (filters = {}) => {
  try {
    const {
      action,
      entityType,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = filters;

    let query = {};

    if (action) {
      query.action = action;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (startDate || endDate) {
      query.performedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.performedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.performedAt.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const entries = await AuditTrail.find(query)
      .populate('performedBy', 'name email')
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditTrail.countDocuments(query);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting audit trail entries:', error);
    throw error;
  }
};

module.exports = {
  createAuditTrailEntry,
  createBookingCreatedEntry,
  createBookingUpdatedEntry,
  createBookingCancelledEntry,
  createBookingDeletedEntry,
  getAuditTrailEntries
};