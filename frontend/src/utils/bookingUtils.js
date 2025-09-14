import { parseISO, isSameDay, format } from 'date-fns';

/**
 * Comprehensive booking utilities for calendar views
 * Handles booking data processing, positioning, and rendering logic
 */

/**
 * Parse time slot string to 24-hour format
 * @param {string} timeSlot - Time in format "9:00 AM" or "2:30 PM"
 * @returns {object} - {hours: number, minutes: number}
 */
export const parseTimeSlot = (timeSlot) => {
  const [timePart, ampm] = timeSlot.split(' ');
  const [hours12, minutes] = timePart.split(':').map(Number);
  let hours24 = hours12;
  
  if (ampm === 'AM' && hours12 === 12) {
    hours24 = 0;
  } else if (ampm === 'PM' && hours12 !== 12) {
    hours24 = hours12 + 12;
  }
  
  return { hours: hours24, minutes: minutes || 0 };
};

/**
 * Create a Date object for a specific time slot on a given date
 * @param {Date} date - The date
 * @param {string} timeSlot - Time slot string
 * @returns {Date} - Date object with time set
 */
export const createSlotDateTime = (date, timeSlot) => {
  const { hours, minutes } = parseTimeSlot(timeSlot);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  return slotDateTime;
};

/**
 * Normalize booking dates to ensure they are Date objects
 * @param {Date|string} dateValue - Date value to normalize
 * @returns {Date} - Normalized Date object
 */
export const normalizeBookingDates = (dateValue) => {
  if (!dateValue) return null;
  
  // If already a Date object, return as is
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a string, parse it
  if (typeof dateValue === 'string' && dateValue.trim() !== '') {
    try {
      return parseISO(dateValue);
    } catch (error) {
      logger.warn('Failed to parse ISO date string:', dateValue, error);
      return null;
    }
  }
  
  // If it's a number (timestamp), convert to Date
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  // For any other type, try to convert to Date
  try {
    return new Date(dateValue);
  } catch (error) {
    logger.warn('Failed to normalize date value:', dateValue, error);
    return null;
  }
};

/**
 * Get all bookings for a specific staff member on a specific date
 * @param {Array} bookings - All bookings
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @returns {Array} - Filtered bookings for the staff on the date
 */
export const getStaffBookingsForDate = (bookings, staffId, date) => {
  const filtered = bookings.filter(booking => {
    const bookingStart = normalizeBookingDates(booking.start);
    const dateMatch = isSameDay(bookingStart, date);
    const staffMatch = booking.extendedProps?.staff === staffId;
    
    // Debug logging
    if (booking.title && (dateMatch || staffMatch)) {
      logger.log('🔍 BookingUtils: Filtering booking:', {
        title: booking.title,
        bookingStaff: booking.extendedProps?.staff,
        targetStaff: staffId,
        staffMatch,
        bookingDate: bookingStart?.toDateString(),
        targetDate: date.toDateString(),
        dateMatch,
        included: dateMatch && staffMatch
      });
    }
    
    return dateMatch && staffMatch;
  });
  
  logger.log(`📊 BookingUtils: Found ${filtered.length} bookings for staff ${staffId} on ${date.toDateString()}`);
  return filtered;
};

/**
 * Get all leave requests for a specific staff member on a specific date
 * @param {Array} leaveRequests - All leave requests
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @returns {Array} - Filtered leave requests for the staff on the date
 */
export const getStaffLeaveRequestsForDate = (leaveRequests, staffId, date) => {
  return leaveRequests.filter(leaveRequest => {
    if (leaveRequest.extendedProps?.type !== 'leave-request') return false;
    
    const leaveStart = normalizeBookingDates(leaveRequest.start);
    const leaveEnd = normalizeBookingDates(leaveRequest.end);
    
    // Check if the date falls within the leave request period (inclusive of end date)
    const dateMatch = date >= leaveStart && date <= leaveEnd;
    const staffMatch = leaveRequest.extendedProps?.staff?._id === staffId || 
                      leaveRequest.extendedProps?.staff?.id === staffId;
    
    return dateMatch && staffMatch;
  });
};

/**
 * Get all events (bookings + leave requests) for a specific staff member on a specific date
 * @param {Array} bookings - All bookings
 * @param {Array} leaveRequests - All leave requests
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @returns {Array} - Combined filtered events for the staff on the date
 */
export const getStaffEventsForDate = (bookings, leaveRequests, staffId, date) => {
  const staffBookings = getStaffBookingsForDate(bookings, staffId, date);
  const staffLeaveRequests = getStaffLeaveRequestsForDate(leaveRequests, staffId, date);
  return [...staffBookings, ...staffLeaveRequests];
};

/**
 * Find booking that overlaps with a specific time slot
 * @param {Array} bookings - All bookings
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @param {string} timeSlot - Time slot string
 * @returns {object|null} - Booking object or null
 */
export const getBookingAtTimeSlot = (bookings, staffId, date, timeSlot) => {
  const staffBookings = getStaffBookingsForDate(bookings, staffId, date);
  const slotDateTime = createSlotDateTime(date, timeSlot);
  
  return staffBookings.find(booking => {
    const bookingStart = normalizeBookingDates(booking.start);
    const bookingEnd = normalizeBookingDates(booking.end);
    return slotDateTime >= bookingStart && slotDateTime < bookingEnd;
  }) || null;
};

/**
 * Find leave request that overlaps with a specific time slot
 * @param {Array} leaveRequests - All leave requests
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @param {string} timeSlot - Time slot string
 * @returns {object|null} - Leave request object or null
 */
export const getLeaveRequestAtTimeSlot = (leaveRequests, staffId, date, timeSlot) => {
  const staffLeaveRequests = getStaffLeaveRequestsForDate(leaveRequests, staffId, date);
  
  // For leave requests, if there's any leave request for this staff on this date,
  // it covers the entire day
  return staffLeaveRequests.length > 0 ? staffLeaveRequests[0] : null;
};

/**
 * Get booking alert at a specific time slot for a staff member
 * @param {Array} bookingAlerts - All booking alerts
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @param {string} timeSlot - Time slot string
 * @returns {object|null} - Booking alert object or null
 */
export const getBookingAlertAtTimeSlot = (bookingAlerts, staffId, date, timeSlot) => {
  if (!bookingAlerts || bookingAlerts.length === 0) return null;
  
  return bookingAlerts.find(alert => {
    if (!alert || alert.extendedProps?.type !== 'booking-alert') return false;
    
    // Check if alert is for this date
    const alertDate = new Date(alert.start);
    if (!isSameDay(alertDate, date)) return false;
    
    // Check if alert overlaps with this time slot
    const slotDateTime = createSlotDateTime(date, timeSlot);
    const alertStart = new Date(alert.start);
    const alertEnd = new Date(alert.end);
    
    return slotDateTime >= alertStart && slotDateTime < alertEnd;
  }) || null;
};

/**
 * Get event (booking, leave request, or booking alert) at a specific time slot for a staff member
 * @param {Array} bookings - All bookings
 * @param {Array} leaveRequests - All leave requests
 * @param {Array} bookingAlerts - All booking alerts
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @param {string} timeSlot - Time slot string
 * @returns {object|null} - Event object or null
 */
export const getEventAtTimeSlot = (bookings, leaveRequests, bookingAlerts, staffId, date, timeSlot) => {
  // Check for leave requests first (highest priority)
  const leaveRequest = getLeaveRequestAtTimeSlot(leaveRequests, staffId, date, timeSlot);
  if (leaveRequest) {
    return leaveRequest;
  }
  
  // Then check for booking alerts
  const bookingAlert = getBookingAlertAtTimeSlot(bookingAlerts, staffId, date, timeSlot);
  if (bookingAlert) {
    return bookingAlert;
  }
  
  // Finally check for regular bookings
  return getBookingAtTimeSlot(bookings, staffId, date, timeSlot);
};

/**
 * Determine the position of a booking within a continuous block
 * @param {Array} bookings - All bookings
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @param {Array} timeSlots - Array of time slot strings
 * @param {number} currentIndex - Current time slot index
 * @param {object} currentBooking - Current booking object
 * @returns {string} - Position class: 'booking-start', 'booking-middle', 'booking-end', or ''
 */
export const getBookingPosition = (bookings, staffId, date, timeSlots, currentIndex, currentBooking) => {
  if (!currentBooking) return '';
  
  const prevTimeSlot = timeSlots[currentIndex - 1];
  const nextTimeSlot = timeSlots[currentIndex + 1];
  
  const prevBooking = prevTimeSlot ? getBookingAtTimeSlot(bookings, staffId, date, prevTimeSlot) : null;
  const nextBooking = nextTimeSlot ? getBookingAtTimeSlot(bookings, staffId, date, nextTimeSlot) : null;
  
  // Handle both FullCalendar format (id) and raw booking format (_id)
  const currentBookingId = currentBooking.id || currentBooking._id;
  const prevBookingId = prevBooking?.id || prevBooking?._id;
  const nextBookingId = nextBooking?.id || nextBooking?._id;
  
  const hasPrevSameBooking = prevBooking && prevBookingId === currentBookingId;
  const hasNextSameBooking = nextBooking && nextBookingId === currentBookingId;
  
  if (!hasPrevSameBooking && hasNextSameBooking) {
    return 'booking-start';
  } else if (hasPrevSameBooking && hasNextSameBooking) {
    return 'booking-middle';
  } else if (hasPrevSameBooking && !hasNextSameBooking) {
    return 'booking-end';
  }
  
  return ''; // Single slot booking
};

/**
 * Format booking time display
 * @param {object} booking - Booking object
 * @returns {string} - Formatted time string
 */
export const formatBookingTime = (booking) => {
  const bookingStart = normalizeBookingDates(booking.start);
  const bookingEnd = normalizeBookingDates(booking.end);
  const startTime = format(bookingStart, 'h:mm a');
  const endTime = format(bookingEnd, 'h:mm a');
  return `${startTime} - ${endTime}`;
};

/**
 * Calculate the height of a booking based on the number of time slots it spans
 * @param {Array} bookings - All bookings
 * @param {string} staffId - Staff member ID
 * @param {Date} date - Target date
 * @param {Array} timeSlots - Array of time slot strings
 * @param {number} currentIndex - Current time slot index
 * @param {object} currentBooking - Current booking object
 * @returns {number} - Height in pixels
 */
export const getBookingHeight = (bookings, staffId, date, timeSlots, currentIndex, currentBooking) => {
  if (!currentBooking) return 60; // Default slot height
  
  // For leave requests, use a fixed height since they are all-day events
  if (currentBooking.extendedProps?.type === 'leave-request' || currentBooking.type === 'leave_request') {
    return 60; // Fixed height for leave requests
  }
  
  // Count how many consecutive slots this booking spans
  const bookingSlots = timeSlots.filter((slot, idx) => {
    const slotBooking = getBookingAtTimeSlot(bookings, staffId, date, slot);
    return slotBooking && slotBooking.id === currentBooking.id;
  }).length;
  
  // Limit height to remaining slots to prevent running off calendar
  const remainingSlots = timeSlots.length - currentIndex;
  const slotHeight = 60; // Height per time slot
  const maxHeight = remainingSlots * slotHeight;
  const totalHeight = Math.min(bookingSlots * slotHeight, maxHeight);
  
  return totalHeight;
};

/**
 * Get booking display data with all necessary information
 * @param {object} booking - Booking object
 * @returns {object} - Formatted booking display data
 */
export const getBookingDisplayData = (booking) => {
  if (!booking) return null;
  
  return {
    id: booking.id,
    title: booking.title || 'Untitled Booking',
    client: booking.extendedProps?.clientName || 'Unknown Client', // Add client property
    clientName: booking.extendedProps?.clientName || 'Unknown Client',
    serviceName: booking.extendedProps?.service?.name || 
                 booking.extendedProps?.serviceName || 
                 booking.service?.name || 
                 'Service',
    timeDisplay: formatBookingTime(booking),
    backgroundColor: booking.backgroundColor || '#FF4444',
    textColor: 'white',
    staff: booking.extendedProps?.staff
  };
};

/**
 * Get leave request display data with all necessary information
 * @param {object} leaveRequest - Leave request object
 * @returns {object} - Formatted leave request display data
 */
export const getLeaveRequestDisplayData = (leaveRequest) => {
  if (!leaveRequest || leaveRequest.extendedProps?.type !== 'leave-request') return null;
  
  const status = leaveRequest.extendedProps?.status || 'pending';
  const staffName = leaveRequest.extendedProps?.staffName || 'Staff';
  const reason = leaveRequest.extendedProps?.reason || 'Leave Request';
  
  let backgroundColor, textColor;
  switch (status) {
    case 'pending':
      backgroundColor = '#FFF3CD'; // Light yellow
      textColor = '#856404';
      break;
    case 'approved':
      backgroundColor = '#D4EDDA'; // Light green
      textColor = '#155724';
      break;
    case 'denied':
      backgroundColor = '#F8D7DA'; // Light red
      textColor = '#721C24';
      break;
    default:
      backgroundColor = '#E2E3E5';
      textColor = '#383D41';
  }
  
  return {
    id: leaveRequest.id,
    title: `🏖️ ${staffName}`,
    client: reason, // Use 'client' property to match booking format structure
    staffName: staffName,
    reason: reason,
    status: status,
    timeDisplay: 'All Day',
    backgroundColor: backgroundColor,
    textColor: textColor,
    staff: leaveRequest.extendedProps?.staff,
    type: 'leave-request'
  };
};

/**
 * Get display data for any event (booking or leave request)
 * @param {object} event - Event object (booking or leave request)
 * @returns {object} - Formatted event display data
 */
export const getEventDisplayData = (event) => {
  if (!event) return null;
  
  if (event.extendedProps?.type === 'leave-request') {
    return getLeaveRequestDisplayData(event);
  } else if (event.extendedProps?.type === 'booking-alert') {
    // Handle booking alerts with special display data
    return {
      title: event.title || 'Booking Alert',
      service: event.extendedProps?.service || 'Alert',
      time: event.extendedProps?.time || '',
      location: event.extendedProps?.location || '',
      client: event.extendedProps?.client || 'Alert',
      status: 'alert',
      type: 'booking-alert'
    };
  } else {
    return getBookingDisplayData(event);
  }
};

/**
 * Check if staff member is working during a specific time slot
 * @param {object} staff - Staff member object
 * @param {Date} date - Target date (for weekly view)
 * @param {string} timeSlot - Time slot string
 * @returns {boolean} - True if working, false otherwise
 */
export const isStaffWorking = (staff, date, timeSlot) => {
  if (!staff.workingHours) return true; // Default to available if no working hours defined
  
  const { hours, minutes } = parseTimeSlot(timeSlot);
  const timeInMinutes = hours * 60 + minutes;
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  const daySchedule = staff.workingHours[dayName];
  if (!daySchedule || !daySchedule.enabled) return false;
  
  // Convert working hours to minutes for comparison
  const startMinutes = daySchedule.start.hours * 60 + daySchedule.start.minutes;
  const endMinutes = daySchedule.end.hours * 60 + daySchedule.end.minutes;
  
  return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
};

// Generate CSS classes for booking slots
export const generateSlotClasses = (slotData) => {
  // Handle null or undefined input
  if (!slotData) {
    return 'staff-time-slot empty';
  }
  
  const { hasBooking, bookingPosition, isWorking } = slotData;
  const classes = ['staff-time-slot'];
  
  if (hasBooking) {
    classes.push('has-booking');
    if (bookingPosition) {
      classes.push(bookingPosition);
    }
  } else {
    classes.push('empty');
  }
  
  if (!isWorking) {
    classes.push('non-working-hours');
  }
  
  return classes.join(' ');
};

// Generate CSS classes for booking events
export const generateBookingEventClasses = (bookingPosition) => {
  const classes = ['booking-event', 'booking-event-colored'];
  
  if (bookingPosition) {
    classes.push(bookingPosition);
  }
  
  return classes.join(' ');
};