/**
 * Custom hooks for calendar data management
 * Provides clean interfaces for fetching and managing calendar-related data
 */

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import {
  fetchBookingAlertsForUser,
  fetchLeaveRequestsForUser,
  shouldFetchBookingAlerts,
  shouldFetchLeaveRequests
} from '../utils/calendarDataUtils';

/**
 * Custom hook for managing booking alerts
 * @returns {Object} - { bookingAlerts, loading, error, refetch }
 */
export const useBookingAlerts = () => {
  const { currentUser, hasRole } = useAuth();
  const [bookingAlerts, setBookingAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    if (!currentUser) {
      setBookingAlerts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const alerts = await fetchBookingAlertsForUser(currentUser, hasRole);
      setBookingAlerts(alerts);
    } catch (err) {
      logger.error('Failed to fetch booking alerts:', err);
      setError(err.message || 'Failed to fetch booking alerts');
      setBookingAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, hasRole]);

  // Auto-fetch when user changes
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    bookingAlerts,
    loading,
    error,
    refetch: fetchAlerts
  };
};

/**
 * Custom hook for managing leave requests
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Object} - { leaveRequests, loading, error, refetch }
 */
export const useLeaveRequests = (startDate = null, endDate = null) => {
  const { currentUser, hasRole } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaveRequests = useCallback(async (startDateParam, endDateParam) => {
    if (!currentUser) {
      setLeaveRequests([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requests = await fetchLeaveRequestsForUser(
        currentUser, 
        hasRole, 
        startDateParam || startDate, 
        endDateParam || endDate
      );
      setLeaveRequests(requests);
    } catch (err) {
      logger.error('Failed to fetch leave requests:', err);
      setError(err.message || 'Failed to fetch leave requests');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, hasRole, startDate, endDate]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  return {
    leaveRequests,
    loading,
    error,
    refetch: fetchLeaveRequests
  };
};

/**
 * Combined hook for all calendar data with role-based filtering
 * @param {Array} bookings - Array of booking events
 * @param {Array} selectedEmployees - Array of selected employee IDs
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Object} - Combined calendar data and utilities
 */
export const useCalendarData = (bookings = [], selectedEmployees = [], startDate = null, endDate = null) => {
  const { currentUser, hasRole } = useAuth();
  const { 
    bookingAlerts, 
    loading: alertsLoading, 
    error: alertsError, 
    refetch: refetchAlerts 
  } = useBookingAlerts();
  const { 
    leaveRequests, 
    loading: leaveLoading, 
    error: leaveError, 
    refetch: refetchLeave 
  } = useLeaveRequests(startDate, endDate);
  
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Import the filtering function dynamically to avoid circular dependencies
  const filterEvents = useCallback(async () => {
    if (alertsLoading || leaveLoading) {
      setFilteredEvents([]);
      return;
    }
    
    const { filterEventsByRole } = await import('../utils/calendarDataUtils');
    
    const filtered = filterEventsByRole(
      bookings,
      bookingAlerts,
      leaveRequests,
      currentUser,
      hasRole,
      selectedEmployees
    );
    
    setFilteredEvents(filtered);
  }, [bookings, bookingAlerts, leaveRequests, currentUser, hasRole, selectedEmployees, alertsLoading, leaveLoading]);

  // Update filtered events when dependencies change
  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const refetchAll = useCallback(() => {
    refetchAlerts();
    refetchLeave();
  }, [refetchAlerts, refetchLeave]);

  return {
    // Individual data arrays
    bookings,
    bookingAlerts,
    leaveRequests,
    
    // Filtered combined data
    filteredEvents,
    
    // Loading states
    loading: alertsLoading || leaveLoading,
    alertsLoading,
    leaveLoading,
    
    // Error states
    error: alertsError || leaveError,
    alertsError,
    leaveError,
    
    // Refetch functions
    refetchAll,
    refetchAlerts,
    refetchLeave,
    
    // User info
    currentUser,
    hasRole,
    
    // Utility functions
    shouldShowAlerts: shouldFetchBookingAlerts(currentUser, hasRole),
    shouldShowLeave: shouldFetchLeaveRequests(currentUser, hasRole)
  };
};

/**
 * Hook for managing calendar date ranges
 * @returns {Object} - Date range utilities
 */
export const useDateRange = () => {
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });

  const setCurrentYearRange = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    const start = new Date(currentYear, 0, 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(currentYear + 1, 11, 31);
    end.setHours(23, 59, 59, 999);
    
    setDateRange({
      start: start.toISOString(),
      end: end.toISOString()
    });
  }, []);

  const setCustomRange = useCallback((startDate, endDate) => {
    setDateRange({
      start: startDate ? new Date(startDate).toISOString() : null,
      end: endDate ? new Date(endDate).toISOString() : null
    });
  }, []);

  const setMonthRange = useCallback((date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const start = new Date(year, month, 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(year, month + 1, 0);
    end.setHours(23, 59, 59, 999);
    
    setDateRange({
      start: start.toISOString(),
      end: end.toISOString()
    });
  }, []);

  // Initialize with current year range
  useEffect(() => {
    if (!dateRange.start && !dateRange.end) {
      setCurrentYearRange();
    }
  }, [dateRange.start, dateRange.end, setCurrentYearRange]);

  return {
    dateRange,
    setCurrentYearRange,
    setCustomRange,
    setMonthRange
  };
};

// PropTypes for hook parameters
useDateRange.propTypes = {
  initialStartDate: PropTypes.instanceOf(Date),
  initialEndDate: PropTypes.instanceOf(Date)
};

useBookingAlerts.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    name: PropTypes.string
  }),
  hasRole: PropTypes.func.isRequired
};

useLeaveRequests.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    name: PropTypes.string
  }),
  hasRole: PropTypes.func.isRequired,
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date)
};

useCalendarData.propTypes = {
  bookings: PropTypes.arrayOf(PropTypes.object),
  selectedEmployees: PropTypes.arrayOf(PropTypes.string),
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date)
};