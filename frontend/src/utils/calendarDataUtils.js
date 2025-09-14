/**
 * Utility functions for calendar data fetching and filtering
 * Handles role-based access control for bookings, alerts, and leave requests
 */

import axiosInstance from './axiosInstance';
import PropTypes from 'prop-types';

/**
 * Determines if a user should see booking alerts based on their role
 * @param {Object} currentUser - The current user object
 * @param {Function} hasRole - Role checking function
 * @returns {boolean} - Whether the user should see booking alerts
 */
export const shouldFetchBookingAlerts = (currentUser, hasRole) => {
  if (!currentUser) return false;
  
  // Only staff members should see booking alerts
  return currentUser.role === 'staff' || hasRole(['staff']);
};

/**
 * Determines if a user should see leave requests based on their role
 * @param {Object} currentUser - The current user object
 * @param {Function} hasRole - Role checking function
 * @returns {boolean} - Whether the user should see leave requests
 */
export const shouldFetchLeaveRequests = (currentUser, hasRole) => {
  if (!currentUser) return false;
  
  // All authenticated users can see leave requests (filtered by backend)
  return true;
};

/**
 * Fetches booking alerts for staff users
 * @param {Object} currentUser - The current user object
 * @param {Function} hasRole - Role checking function
 * @returns {Promise<Array>} - Array of booking alert events
 */
export const fetchBookingAlertsForUser = async (currentUser, hasRole) => {
  try {
    logger.log('🚨 fetchBookingAlertsForUser called with user:', currentUser?.name, 'role:', currentUser?.role);
    
    if (!shouldFetchBookingAlerts(currentUser, hasRole)) {
      logger.log('❌ Not fetching alerts - user is not staff');
      return [];
    }
    
    if (!currentUser?._id) {
      logger.warn('No current user ID available for fetching booking alerts');
      return [];
    }
    
    logger.log('✅ User is staff, proceeding to fetch alerts');
    
    const res = await axiosInstance.get('/booking-alerts/available');
    
    if (!res.data || !res.data.data) {
      logger.warn('Invalid booking alerts response format');
      return [];
    }
    
    const alerts = Array.isArray(res.data.data) ? res.data.data : [];
    
    logger.log('Available booking alerts from API:', alerts.length, 'alerts');
    
    // Transform alerts for calendar display
    const calendarAlerts = alerts.map(alert => {
      if (!alert._id || !alert.title || !alert.startTime || !alert.endTime) {
        logger.warn('Invalid alert data structure:', alert);
        return null;
      }
      
      return {
        id: `alert-${alert._id}`,
        title: `🚨 ${alert.title}`,
        start: new Date(alert.startTime),
        end: new Date(alert.endTime),
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        textColor: '#ffffff',
        extendedProps: {
          type: 'booking-alert',
          alertId: alert._id,
          staff: alert.staff,
          title: alert.title,
          description: alert.description,
          status: alert.status,
          priority: alert.priority
        },
        classNames: ['booking-alert-event', 'flashing-border']
      };
    }).filter(Boolean);
    
    return calendarAlerts;
  } catch (err) {
    logger.error('Error fetching booking alerts:', err);
    if (err.response?.status === 401) {
      logger.error('Unauthorized access to booking alerts');
    } else if (err.response?.status === 403) {
      logger.error('Forbidden access to booking alerts');
    } else if (err.response?.status >= 500) {
      logger.error('Server error while fetching booking alerts');
    }
    return [];
  }
};

/**
 * Fetches leave requests with proper date range
 * @param {Object} currentUser - The current user object
 * @param {Function} hasRole - Role checking function
 * @param {string} startDateParam - Optional start date
 * @param {string} endDateParam - Optional end date
 * @returns {Promise<Array>} - Array of leave request events
 */
export const fetchLeaveRequestsForUser = async (currentUser, hasRole, startDateParam, endDateParam) => {
  try {
    logger.log('🍃 fetchLeaveRequestsForUser called with user:', currentUser?.name, 'role:', currentUser?.role);
    
    if (!shouldFetchLeaveRequests(currentUser, hasRole)) {
      logger.log('❌ Not fetching leave requests - no current user');
      return [];
    }
    
    if (!currentUser?._id) {
      logger.warn('No current user ID available for fetching leave requests');
      return [];
    }
    
    let startDate, endDate;
    
    if (startDateParam && endDateParam) {
      startDate = startDateParam;
      endDate = endDateParam;
    } else {
      // Default: Get a wider date range to include future leave requests
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      const start = new Date(currentYear, 0, 1);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(currentYear + 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      
      startDate = start.toISOString();
      endDate = end.toISOString();
    }
    
    const formattedStartDate = new Date(startDate).toISOString();
    const formattedEndDate = new Date(endDate).toISOString();
    
    const apiUrl = `/leave-requests?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
    logger.log('Fetching leave requests from:', apiUrl);
    
    const res = await axiosInstance.get(apiUrl);
    
    if (!res.data || !res.data.data) {
      logger.warn('Invalid leave requests response format');
      return [];
    }
    
    const leaveRequestsData = Array.isArray(res.data.data) ? res.data.data : [];
    
    logger.log('🍃 Raw leave requests data:', leaveRequestsData.length, 'requests');
    
    // Transform leave requests for FullCalendar
    const leaveEvents = leaveRequestsData.map(request => {
      if (!request._id || !request.startDate) {
        logger.warn('Invalid leave request data structure:', request);
        return null;
      }
      
      const staff = request.staff || {};
      const staffName = staff.firstName && staff.lastName ? 
        `${staff.firstName} ${staff.lastName}` : 
        staff.name || 'Unknown Staff';
      
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      // For FullCalendar all-day events, we need to add one day to the end date
      // but only for display purposes. We'll use the original endDate for conflict detection
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      // Store the original end date for accurate conflict detection
      const originalEndDate = new Date(endDate);
      originalEndDate.setHours(23, 59, 59, 999); // End of the actual day
      
      let backgroundColor, textColor, title;
      
      switch (request.status) {
        case 'pending':
          backgroundColor = '#FFF3CD';
          textColor = '#856404';
          title = `${staffName} - Leave Request (Pending)`;
          break;
        case 'approved':
          backgroundColor = '#D4EDDA';
          textColor = '#155724';
          title = `${staffName} - Leave (Approved)`;
          break;
        case 'denied':
          backgroundColor = '#F8D7DA';
          textColor = '#721C24';
          title = `${staffName} - Leave Request (Denied)`;
          break;
        default:
          backgroundColor = '#E2E3E5';
          textColor = '#383D41';
          title = `${staffName} - Leave Request`;
      }
      
      return {
        id: `leave-${request._id}`,
        title: title,
        start: startDate,
        end: adjustedEndDate,
        allDay: true,
        extendedProps: {
          type: 'leave-request',
          leaveRequestId: request._id,
          staff: request.staff,
          staffName: staffName,
          reason: request.reason || '',
          status: request.status || 'pending',
          denialReason: request.denialReason,
          reviewedBy: request.reviewedBy,
          reviewedAt: request.reviewedAt,
          originalEndDate: originalEndDate // Store original end date for conflict detection
        },
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: textColor,
        classNames: ['leave-request-event', `leave-${request.status}`]
      };
    }).filter(Boolean);
    
    return leaveEvents;
  } catch (err) {
    logger.error('Error fetching leave requests:', err);
    if (err.response?.status === 401) {
      logger.error('Unauthorized access to leave requests');
    } else if (err.response?.status === 403) {
      logger.error('Forbidden access to leave requests');
    } else if (err.response?.status >= 500) {
      logger.error('Server error while fetching leave requests');
    }
    return [];
  }
};

/**
 * Normalizes user ID for comparison (handles MongoDB ObjectID)
 * @param {string|Object} userId - User ID to normalize
 * @returns {string} - Normalized user ID
 */
export const normalizeUserId = (userId) => {
  if (!userId) return null;
  
  // Handle MongoDB ObjectID
  if (typeof userId === 'object' && userId._bsontype === 'ObjectID') {
    const buffer = userId.id;
    return Object.values(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  return String(userId);
};

/**
 * Checks if two user IDs match (handles different ID formats)
 * @param {string|Object} userId1 - First user ID
 * @param {string|Object} userId2 - Second user ID
 * @returns {boolean} - Whether the IDs match
 */
export const userIdsMatch = (userId1, userId2) => {
  const normalizedId1 = normalizeUserId(userId1);
  const normalizedId2 = normalizeUserId(userId2);
  
  return normalizedId1 === normalizedId2;
};

/**
 * Filters events based on user role and selected employees
 * @param {Array} bookings - Array of booking events
 * @param {Array} bookingAlerts - Array of booking alert events
 * @param {Array} leaveRequests - Array of leave request events
 * @param {Object} currentUser - Current user object
 * @param {Function} hasRole - Role checking function
 * @param {Array} selectedEmployees - Array of selected employee IDs
 * @returns {Array} - Filtered array of events
 */
export const filterEventsByRole = (bookings, bookingAlerts, leaveRequests, currentUser, hasRole, selectedEmployees) => {
  let filtered = [];
  
  logger.log('🔍 Filtering events by role:', {
    userRole: currentUser?.role,
    bookingsCount: bookings.length,
    alertsCount: bookingAlerts.length,
    leaveRequestsCount: leaveRequests.length,
    selectedEmployeesCount: selectedEmployees.length
  });
  
  if (hasRole(['staff'])) {
    // Staff users see only their own bookings and alerts
    const userBookings = bookings.filter(booking => {
      const staffObj = booking.extendedProps.staff;
      const staffId = staffObj?._id || staffObj;
      const userId = currentUser?._id || currentUser?.id;
      
      const matches = userIdsMatch(staffId, userId);
      logger.log('🔍 Staff booking check:', { staffId, userId, matches });
      return matches;
    });
    
    // Add booking alerts for staff members
    filtered = [...userBookings, ...bookingAlerts];
    
    // Add their own leave requests
    const staffLeaveRequests = leaveRequests.filter(leave => {
      const staffObj = leave.extendedProps.staff;
      const leaveStaffId = staffObj?._id || staffObj;
      const userId = currentUser?._id || currentUser?.id;
      
      const matches = userIdsMatch(leaveStaffId, userId);
      logger.log('🍃 Staff leave request check:', { leaveStaffId, userId, matches });
      return matches;
    });
    
    filtered = [...filtered, ...staffLeaveRequests];
    logger.log('✅ Staff filtered events:', filtered.length);
    
  } else if (hasRole(['manager', 'superuser', 'admin']) && selectedEmployees.length > 0) {
    // Managers see selected employees' bookings
    filtered = bookings.filter(booking => 
      selectedEmployees.includes(booking.extendedProps.staff)
    );
    
    // Add leave requests for selected employees
    const selectedLeaveRequests = leaveRequests.filter(leave => 
      leave.extendedProps.staff && selectedEmployees.includes(leave.extendedProps.staff._id)
    );
    
    filtered = [...filtered, ...selectedLeaveRequests];
    logger.log('✅ Manager filtered events (selected):', filtered.length);
    
  } else if (hasRole(['manager', 'superuser', 'admin'])) {
    // Managers see all bookings, alerts, and leave requests
    filtered = [...bookings, ...bookingAlerts, ...leaveRequests];
    logger.log('✅ Manager filtered events (all):', filtered.length);
  }
  
  // Add resourceId to each event for staff column display
  filtered = filtered.map(event => {
    let staffId;
    
    if (event.extendedProps.type === 'booking-alert') {
      staffId = event.extendedProps.staff;
    } else if (event.extendedProps.type === 'leave-request') {
      staffId = event.extendedProps.staff?._id || event.extendedProps.staff;
    } else {
      staffId = event.extendedProps.staff;
    }
    
    return {
      ...event,
      resourceId: staffId || currentUser._id
    };
  });
  
  return filtered;
};