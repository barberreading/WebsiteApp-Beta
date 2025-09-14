import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { debounce } from '../utils/debounce';
import CustomWeeklyView from '../components/calendar/CustomWeeklyView';
import CustomDayView from '../components/calendar/CustomDayView';
import { Container, Row, Col, Card, Button, Modal, Form, ButtonGroup, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { handleApiError, validateToken } from '../utils/errorHandler';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useHasRole } from '../utils/roleUtils';

// UK Bank Holidays for the current year
const UK_BANK_HOLIDAYS_2023 = [
  '2023-01-02', // New Year's Day (observed)
  '2023-04-07', // Good Friday
  '2023-04-10', // Easter Monday
  '2023-05-01', // Early May Bank Holiday
  '2023-05-08', // King's Coronation Bank Holiday
  '2023-05-29', // Spring Bank Holiday
  '2023-08-28', // Summer Bank Holiday
  '2023-12-25', // Christmas Day
  '2023-12-26', // Boxing Day
];

// UK Bank Holidays for next year
const UK_BANK_HOLIDAYS_2024 = [
  '2024-01-01', // New Year's Day
  '2024-03-29', // Good Friday
  '2024-04-01', // Easter Monday
  '2024-05-06', // Early May Bank Holiday
  '2024-05-27', // Spring Bank Holiday
  '2024-08-26', // Summer Bank Holiday
  '2024-12-25', // Christmas Day
  '2024-12-26', // Boxing Day
];

// Add custom CSS styles for calendar
const calendarStyles = `
  .weekend-day {
    background-color: #f5f5f5 !important;
  }
  
  .bank-holiday {
    background-color: #e9e9e9 !important;
    position: relative;
  }
  
  .bank-holiday:after {
    content: "Bank Holiday";
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 9px;
    color: #888;
  }
  
  /* Base event styling */
  .fc-event {
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    min-height: 30px !important;
    height: auto !important;
    border: none !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: block !important;
  }
  
  /* Time grid event styling for solid blocks */
  .fc-timegrid-event {
    border-radius: 6px !important;
    border: none !important;
    margin: 0 !important;
    width: 100% !important;
    min-height: 30px !important;
    height: 100% !important;
    display: block !important;
  }
  
  .fc-timegrid-event .fc-event-main {
    height: 100% !important;
    min-height: 30px !important;
    padding: 4px 6px;
    border-radius: 6px !important;
    display: block !important;
    width: 100% !important;
  }
  
  /* Event harness - container for events */
  .fc-timegrid-event-harness {
    margin: 0 2px !important;
    left: 2px !important;
  }
  
  /* Booking alert specific styling */
  .booking-alert-event {
    border-left: 4px solid #f57c00 !important;
    animation: pulse 2s infinite;
  }
  
  /* Flashing red border animation for booking alerts */
  .flashing-border {
    border: 3px solid #dc3545 !important;
    animation: flashingBorder 1.5s infinite;
  }
  
  /* Leave request specific styling */
  .leave-request-event {
    border-left: 4px solid #6c757d !important;
    opacity: 0.8;
  }
  
  .leave-pending {
    background-color: #fff3cd !important;
    border-color: #ffc107 !important;
    color: #856404 !important;
  }
  
  .leave-approved {
    background-color: #d4edda !important;
    border-color: #28a745 !important;
    color: #155724 !important;
  }
  
  .leave-denied {
    background-color: #f8d7da !important;
    border-color: #dc3545 !important;
    color: #721c24 !important;
  }
  
  @keyframes flashingBorder {
    0% { border-color: #dc3545; box-shadow: 0 0 5px rgba(220, 53, 69, 0.8); }
    50% { border-color: #ff6b6b; box-shadow: 0 0 15px rgba(220, 53, 69, 1); }
    100% { border-color: #dc3545; box-shadow: 0 0 5px rgba(220, 53, 69, 0.8); }
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
    right: 2px !important;
    min-height: 30px !important;
    height: 100% !important;
  }
  
  /* Hover effects */
  .fc-event:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    z-index: 15;
    filter: brightness(1.1);
  }
  
  /* Specific styling for time grid views */
  .fc-timegrid-view .fc-timegrid-event {
    border-radius: 6px !important;
    margin: 0 !important;
  }
  
  .fc-timegrid-view .fc-timegrid-event-harness {
    margin: 0 2px !important;
  }
  
  /* Remove default borders and ensure full width */
  .fc-timegrid-event .fc-event-main {
    border: none !important;
    background: inherit !important;
  }
  
  /* Force solid block appearance with flexbox approach */
  .fc-timegrid-view .fc-timegrid-event-harness {
    left: 2px !important;
    right: 2px !important;
    width: calc(100% - 4px) !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .fc-timegrid-view .fc-timegrid-event {
    flex: 1 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .fc-timegrid-view .fc-timegrid-event .fc-event-main {
    flex: 1 !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Specific day view overrides */
  .fc-timeGridDay-view .fc-timegrid-event-harness {
    min-height: 100% !important;
    height: auto !important;
  }
  
  .fc-timeGridDay-view .fc-timegrid-event {
    min-height: 100% !important;
    height: auto !important;
  }
  
  /* Force events to fill time slots completely */
  .fc-timegrid-slot {
    position: relative !important;
  }
  
  .fc-timegrid-event-harness {
    z-index: 2 !important;
  }
  
  /* Override FullCalendar's event positioning */
  .fc-timegrid-event {
    border-radius: 4px !important;
    box-sizing: border-box !important;
  }
  
  /* Force day view events to span full duration */
  .fc-timeGridDay-view .fc-timegrid-event-harness {
    position: absolute !important;
    left: 2px !important;
    right: 2px !important;
    width: calc(100% - 4px) !important;
  }
  
  .fc-timeGridDay-view .fc-timegrid-event {
    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Ensure event content fills the entire event block */
  .fc-timeGridDay-view .fc-event-main {
    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    height: 100% !important;
    padding: 4px !important;
    box-sizing: border-box !important;
  }
  
  /* Override any thin line styling */
  .fc-timegrid-event .fc-event-main-frame {
    height: 100% !important;
    min-height: 30px !important;
  }
  
  .fc-event .fc-event-main-frame {
    height: 100% !important;
    min-height: 30px !important;
  }
  
  /* Smooth transitions */
  .fc-event, .fc-timegrid-event, .fc-timegrid-event-harness {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .fc-event-title {
    font-weight: bold;
    margin-bottom: 2px;
    color: #000 !important;
    text-shadow: 0 0 2px rgba(255,255,255,0.8);
  }
  
  .fc-event-service, .fc-event-time, .fc-event-location {
    color: #000 !important;
    text-shadow: 0 0 1px rgba(255,255,255,0.6);
  }
  
  /* Ensure text is readable on colored backgrounds */
  .fc-event-content {
    color: #000 !important;
  }
  
  .fc-timegrid-event .fc-event-content {
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }
  
  /* Enhanced event text visibility */
  .fc-event-content {
    color: #000 !important;
  }
  
  .fc-event-main {
    color: #000 !important;
  }
  
  .staff-segment:hover, .staff-time-segment:hover {
    background-color: rgba(0, 120, 255, 0.1);
    cursor: pointer;
  }
  
  .fc-event-location, .fc-event-service, .fc-event-client {
    font-size: 0.8em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Ensure time labels stay visible - Enhanced for staff users */
  .fc-timegrid-axis {
    position: sticky !important;
    left: 0 !important;
    z-index: 15 !important;
    background: #f8f9fa !important;
    box-shadow: 2px 0 4px rgba(0,0,0,0.1) !important;
    min-width: 60px !important;
    width: 60px !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  .fc-timegrid-slot-label {
    position: sticky !important;
    left: 0 !important;
    z-index: 15 !important;
    background: #f8f9fa !important;
    border-right: 1px solid #dee2e6 !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
    color: #495057 !important;
    text-align: right !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    min-height: 20px !important;
  }
  
  .fc-timegrid-axis-cushion {
    position: sticky !important;
    left: 0 !important;
    z-index: 15 !important;
    background: #f8f9fa !important;
    padding: 4px 8px !important;
  }
  
  /* Ensure calendar container allows horizontal scrolling */
  .fc-view-harness {
    overflow-x: auto !important;
  }
  
  .fc-timegrid {
    min-width: fit-content !important;
  }
  
  /* Force time axis to be visible - Enhanced */
  .fc-timegrid-axis-frame {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    min-width: 60px !important;
    width: 60px !important;
  }
  
  .fc-timegrid-axis-cushion {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    min-width: 60px !important;
    width: 60px !important;
  }
  
  /* Ensure time grid body shows time axis */
  .fc-timegrid-body {
    position: relative !important;
  }
  
  .fc-timegrid-body .fc-timegrid-axis {
    display: block !important;
    visibility: visible !important;
  }
  
  .fc-timegrid-slots {
    position: relative !important;
  }
  
  .fc-timegrid-slot {
    height: 48px !important;
    border-bottom: 1px solid #dee2e6 !important;
  }
`;

const Calendar = () => {
  const { currentUser, isUserLoaded, hasRole } = useAuth();
  const calendarRef = useRef(null);
  const hasManagerRole = useHasRole(['manager', 'superuser', 'admin']);
  
  

  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [bookingAlerts, setBookingAlerts] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'view'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [locationAreas, setLocationAreas] = useState([]);
  const [bookingCategories, setBookingCategories] = useState([]);
  
  // Timify-like view states
  const [currentView, setCurrentView] = useState('week'); // 'month', 'week', 'day'
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  // Use current date for calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Removed unused state variables: showDailyLimits, isLoading, serviceFilter
  const [selectedLocationArea, setSelectedLocationArea] = useState('all');
  
  // Calendar customization options
  const [firstDay, setFirstDay] = useState(1); // 0 = Sunday, 1 = Monday (default)
  const [businessHours, setBusinessHours] = useState({
    startTime: '07:00', // default 7:00am
    endTime: '18:30'    // default 6:30pm
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Booking alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  // Removed unused alertAction state variable
  
  const [formData, setFormData] = useState({
    bookingKey: '',
    service: '',
    client: '',
    staff: '',
    startTime: '',
    endTime: '',
    location: {
      address: '',
      city: '',
      postcode: ''
    },
    locationArea: '',
    categories: [],
    notes: '',
    isRecurring: false,
    recurringDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false
    },
    recurringWeeks: 0
  });
  
  const [bookingKeys, setBookingKeys] = useState([]);
  
  const [bookingStep, setBookingStep] = useState(1); // 1: booking key, 2: service, 3: client, 4: staff & time

  // Load view preferences from localStorage
  const loadViewPreferences = useCallback(() => {
    // Clear potentially corrupted localStorage data first
    const clearCorruptedData = () => {
      try {
        const savedEmployees = localStorage.getItem('selectedEmployees');
        if (savedEmployees) {
          JSON.parse(savedEmployees); // Test if it's valid JSON
        }
      } catch (error) {
        // Clearing corrupted localStorage data
        localStorage.removeItem('calendarView');
        localStorage.removeItem('selectedEmployees');
        localStorage.removeItem('calendarFirstDay');
        localStorage.removeItem('calendarStartTime');
        localStorage.removeItem('calendarEndTime');
      }
    };
    
    clearCorruptedData();
    
    const savedView = localStorage.getItem('calendarView');
    const savedEmployees = localStorage.getItem('selectedEmployees');
    const savedFirstDay = localStorage.getItem('calendarFirstDay');
    const savedStartTime = localStorage.getItem('calendarStartTime');
    const savedEndTime = localStorage.getItem('calendarEndTime');
    
    if (savedView && ['month', 'week', 'day'].includes(savedView)) {
      setCurrentView(savedView);
    }
    if (savedEmployees && staffList.length > 0) {
      try {
        const parsedEmployees = JSON.parse(savedEmployees);
        // Validate that the employee IDs still exist in staffList
        const validEmployees = parsedEmployees.filter(empId => 
          staffList.some(staff => staff._id === empId)
        );
        // Enforce view-based limits on saved selections
        const maxSelection = currentView === 'week' ? 4 : staffList.length;
        const limitedEmployees = validEmployees.slice(0, maxSelection);
        setSelectedEmployees(limitedEmployees);
      } catch (error) {
        logger.error('Error parsing saved employees:', error);
        localStorage.removeItem('selectedEmployees');
      }
    } else {
      // Auto-select staff members for managers/admins if none are saved (respecting view limits)
      if (staffList.length > 0 && hasRole(['manager', 'superuser', 'admin'])) {
        const maxSelection = currentView === 'week' ? 4 : staffList.length;
        const autoSelected = staffList.slice(0, maxSelection).map(staff => staff._id);
        setSelectedEmployees(autoSelected);
      } else if (staffList.length > 0 && hasRole(['staff'])) {
        // For staff users, auto-select only themselves
        const currentStaff = staffList.find(staff => staff.email === currentUser?.email);
        if (currentStaff) {
          setSelectedEmployees([currentStaff._id]);
        }
      }
    }
    if (savedFirstDay !== null) {
      setFirstDay(parseInt(savedFirstDay));
    }
    if (savedStartTime) {
      setBusinessHours(prev => ({ ...prev, startTime: savedStartTime }));
    }
    if (savedEndTime) {
      setBusinessHours(prev => ({ ...prev, endTime: savedEndTime }));
    }
  }, [staffList, hasRole, currentUser, currentView]);

  // Save view preferences to localStorage
  const saveViewPreferences = (view, employees) => {
    localStorage.setItem('calendarView', view);
    localStorage.setItem('selectedEmployees', JSON.stringify(employees));
  };
  
  // Save calendar settings to localStorage
  const saveCalendarSettings = (firstDay, startTime, endTime) => {
    localStorage.setItem('calendarFirstDay', firstDay);
    localStorage.setItem('calendarStartTime', startTime);
    localStorage.setItem('calendarEndTime', endTime);
    
    setFirstDay(firstDay);
    setBusinessHours({
      startTime: startTime,
      endTime: endTime
    });
  };

  // Fetch leave requests from API
  const fetchLeaveRequests = useCallback(async (startDateParam, endDateParam) => {
    try {
      logger.log('fetchLeaveRequests called with currentUser:', currentUser?.name, 'role:', currentUser?.role);
      let startDate, endDate;
      
      if (startDateParam && endDateParam) {
        startDate = startDateParam;
        endDate = endDateParam;
      } else {
        // Default: Get a wider date range to include future leave requests
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        const start = new Date(currentYear, 0, 1); // Start of current year
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(currentYear + 1, 11, 31); // End of next year
        end.setHours(23, 59, 59, 999);
        
        startDate = start.toISOString();
        endDate = end.toISOString();
      }
      
      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();
      
      let apiUrl = `/leave-requests?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      logger.log('Fetching leave requests from:', apiUrl);

      
      // Note: Backend automatically filters leave requests by staff role
      // Staff users only see their own requests, managers see all
      
      const res = await axiosInstance.get(apiUrl);
      logger.log('Leave requests API response:', res.data);
      const leaveRequestsData = res.data.data || [];
      
      // Transform leave requests for FullCalendar
      const leaveEvents = leaveRequestsData.map(request => {
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
            backgroundColor = '#FFF3CD'; // Light yellow
            textColor = '#856404';
            title = `${staffName} - Leave Request (Pending)`;
            break;
          case 'approved':
            backgroundColor = '#D4EDDA'; // Light green
            textColor = '#155724';
            title = `${staffName} - Leave (Approved)`;
            break;
          case 'denied':
            backgroundColor = '#F8D7DA'; // Light red
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
            reason: request.reason || 'No reason provided',
            status: request.status || 'pending',
            denialReason: request.denialReason || '',
            reviewedBy: request.reviewedBy,
            reviewedAt: request.reviewedAt,
            originalEndDate: originalEndDate // Store original end date for conflict detection
          },
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          textColor: textColor,
          classNames: ['leave-request-event', `leave-${request.status}`]
        };
      });
      

      
      return leaveEvents;
    } catch (err) {
      logger.error('Error fetching leave requests:', err);
      return [];
    }
  }, [currentUser]);

  // Fetch bookings from API
  const fetchBookings = useCallback(async (startDateParam, endDateParam) => {
    try {
      // Removed unused loading state
      
      // Use provided date parameters or default to current month
      let startDate, endDate;
      
      if (startDateParam && endDateParam) {
        startDate = startDateParam;
        endDate = endDateParam;
      } else {
        // Default: Get start and end of current month for filtering
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        const start = new Date(currentYear, currentMonth, 1);
        start.setHours(0, 0, 0, 0); // Set to beginning of day
        
        const end = new Date(currentYear, currentMonth + 1, 0);
        end.setHours(23, 59, 59, 999); // Set to end of day
        
        // Format dates for API
        startDate = start.toISOString();
        endDate = end.toISOString();
      }
      
      // Ensure dates are properly formatted for the API
      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();
      
      // Add role-based filtering parameters
      let apiUrl = `/bookings/range?startDate=${formattedStartDate}&endDate=${formattedEndDate}&limit=100`;
      
      // Apply permission-based filtering based on user role
      if (currentUser?.role === 'staff') {
        // Staff can only see their own bookings
        apiUrl += `&staffId=${currentUser._id}`;
      } else if (currentUser?.role === 'client') {
        // Clients can only see their own bookings
        apiUrl += `&clientId=${currentUser._id}`;
      }
      // Managers and superusers see all bookings (no additional filtering)
      
      logger.log('📅 Calendar: Making API call to:', apiUrl);
      const res = await axiosInstance.get(apiUrl);
      logger.log('📅 Calendar: API response:', res.data);
      
      // Handle new paginated response format
      const bookingsData = res.data.data || [];
      logger.log('📅 Calendar: Extracted bookings data:', bookingsData?.length, 'bookings');
      

      // Transform bookings for FullCalendar with error handling
  const calendarEvents = (bookingsData || []).filter(booking => {
    // Filter out invalid bookings
    return booking && booking._id && booking.startTime && booking.endTime;
  }).map(booking => {
    try {
      // Find the service to get its color
      // booking.service is already populated from backend, so use it directly
      const service = booking.service || serviceList.find(s => s._id === booking.service);
      const serviceColor = service?.color; // Use actual service color without default
      
      // Use service color directly since we now have pastel colors
      const backgroundColor = serviceColor || '#E3F2FD'; // Use service color or default light blue
      
      // Find client details if available
      const client = booking.client || {};
      const clientName = client.firstName && client.lastName ? 
        `${client.firstName} ${client.lastName}` : 
        client.name || 'Unknown Client';
      const clientAddress = client.address || 'No address provided';
      
      // Find staff details if available
      const staff = booking.staff || {};
      const staffName = staff.firstName && staff.lastName ? 
        `${staff.firstName} ${staff.lastName}` : 
        staff.name || 'No Staff Assigned';
      
      // Create a more descriptive title that includes service type and location
      const serviceTitle = service?.name || booking.title || 'Booking';
      const locationText = booking.location ? ` @ ${booking.location}` : '';
    
      // Ensure start and end times are proper Date objects
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      
      // Debug log for duration issues
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        logger.warn('Invalid booking times:', { id: booking._id, start: booking.startTime, end: booking.endTime });
      }
      
      return {
      id: booking._id,
      title: `${clientName} - ${serviceTitle}${locationText}`,
      start: startTime,
      end: endTime,
      allDay: false,
      extendedProps: {
        description: booking.description || '',
        staff: booking.staff?._id || booking.staff,
        staffName: staffName,
        client: booking.client,
        clientName: clientName,
        clientAddress: clientAddress,
        location: booking.location || '',
        status: booking.status || 'scheduled',
        service: booking.service,
        serviceName: service?.name || 'Unknown Service',
        type: 'booking'
      },
      backgroundColor: backgroundColor,
      borderColor: getStatusColor(booking.status || 'scheduled'),
      textColor: getContrastColor(backgroundColor),
      classNames: ['booking-event', `status-${booking.status || 'scheduled'}`]
        };
    } catch (mapError) {
      logger.error('Error processing booking:', booking, mapError);
      // Return a fallback event for invalid bookings
      return {
        id: booking._id || 'invalid-' + Math.random(),
        title: 'Invalid Booking',
        start: booking.startTime || new Date(),
        end: booking.endTime || new Date(),
        backgroundColor: '#ff0000',
        textColor: '#ffffff'
      };
    }
  }).filter(event => event !== null);
      
      logger.log('📅 Calendar: Processed calendar events:', calendarEvents?.length, 'events');
      logger.log('📅 Calendar: Sample event:', calendarEvents?.[0]);
      setBookings(calendarEvents);
      logger.log('📅 Calendar: Set bookings state with', calendarEvents?.length, 'events');
    } catch (err) {
      logger.error('Error fetching bookings:', err);
      
      // Set empty bookings array to prevent UI errors
      setBookings([]);
      
      // Use the friendly message from our axios interceptor if available
      if (err.isNetworkError) {
        toast.error(err.friendlyMessage || 'Network error: Unable to connect to the server');
        
        // Don't retry here as the axios interceptor already handles retries
        // This prevents duplicate retry attempts
      } else if (err.response) {
        // Server responded with an error status
        toast.error(`Failed to fetch bookings: ${err.response.data.message || 'Server error'}`);
      } else if (err.request) {
        // Request was made but no response received (network error)
        toast.error('Network error: Unable to connect to the server');
      } else {
        // Something else caused the error
        toast.error(`Error fetching bookings: ${err.message}`);
      }
      
      // Removed unused loading state
    }
  }, [currentUser, serviceList]);

  // Fetch booking alerts for the current user
  const fetchBookingAlerts = useCallback(async () => {
    try {
      logger.log('🚨 fetchBookingAlerts called with currentUser:', currentUser?.name, 'role:', currentUser?.role);
      logger.log('🚨 Full currentUser object:', JSON.stringify(currentUser, null, 2));
      logger.log('🚨 Role check - currentUser exists:', !!currentUser);
      logger.log('🚨 Role check - role value:', currentUser?.role);
      logger.log('🚨 Role check - role type:', typeof currentUser?.role);
      logger.log('🚨 Role check - is staff:', currentUser?.role === 'staff');
      
      // Only fetch alerts for staff members
      if (!currentUser || currentUser.role !== 'staff') {
        logger.log('❌ Not fetching alerts - user is not staff or not logged in');
        logger.log('❌ Reason: currentUser exists?', !!currentUser, 'role:', currentUser?.role);
        setBookingAlerts([]);
        return;
      }
      
      logger.log('✅ User is staff, proceeding to fetch alerts');

      const res = await axiosInstance.get('/booking-alerts/available');
      const alerts = Array.isArray(res.data.data) ? res.data.data : [];
      logger.log('Available booking alerts from API:', alerts.length, 'alerts');
      logger.log('Alert details:', alerts.map(a => ({ title: a.title, status: a.status })));

      // Transform alerts for calendar display (no filtering needed - backend already filtered)
      const calendarAlerts = alerts.map(alert => ({
        id: `alert-${alert._id}`,
        title: `🚨 ${alert.title}`,
        start: new Date(alert.startTime),
        end: new Date(alert.endTime),
        backgroundColor: '#dc3545', // Red color for alerts
        borderColor: '#dc3545',
        textColor: '#ffffff',
        extendedProps: {
          type: 'booking-alert',
          alertId: alert._id,
          description: alert.description,
          service: alert.service,
          location: alert.location,
          status: alert.status,
          bookingKey: alert.bookingKey,
          staff: currentUser._id, // Add staff ID for proper resourceId assignment
          staffName: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}` || 'Staff'
        },
        classNames: ['booking-alert-event', 'flashing-border']
      }));

      logger.log('Fetched booking alerts:', calendarAlerts.length, 'alerts');
      logger.log('Alert details:', calendarAlerts);
      setBookingAlerts(calendarAlerts);
    } catch (err) {
      logger.error('Error fetching booking alerts:', err);
      setBookingAlerts([]);
    }
  }, [currentUser]);

  // Create debounced version of fetchBookings for datesSet callback
  const debouncedFetchBookings = useMemo(
    () => debounce(async (startDate, endDate) => {
      await fetchBookings(startDate, endDate);
    }, 300),
    [fetchBookings]
  );

  // Fetch staff, services, clients and booking keys for dropdown
  const fetchData = useCallback(async () => {
    try {
      if (!validateToken()) {
        throw new Error('Authentication token not found');
      }
      
      if (!currentUser) {
        logger.log('🚨 CRITICAL: currentUser is null/undefined, exiting fetchData early!');
        logger.log('🚨 This is why staffList shows 0 available!');
        logger.log('🚨 currentUser value:', currentUser);
        logger.log('🚨 typeof currentUser:', typeof currentUser);
        return;
      }
      
      logger.log('✅ currentUser exists, proceeding with fetchData:', currentUser);
      
      // Build API requests based on user role and permissions
      const apiRequests = [
        axiosInstance.get('/services?active=true'),
        axiosInstance.get('/booking-categories/keys'),
        axiosInstance.get('/booking-categories/areas')
      ];
      
      // Add staff and client requests based on role permissions
      if (currentUser?.role === 'staff') {
        // Staff can only see themselves
        logger.log('🔧 DEBUG: Staff user - adding current user to staff list:', currentUser);
        logger.log('🔧 DEBUG: Current user structure:', JSON.stringify(currentUser, null, 2));
        logger.log('🔧 DEBUG: Current user has name?', !!currentUser?.name);
        logger.log('🔧 DEBUG: Current user has _id?', !!currentUser?._id);
        apiRequests.unshift(Promise.resolve({ data: [currentUser] }));
        apiRequests.push(axiosInstance.get('/clients')); // Staff can see clients for bookings
      } else if (currentUser?.role === 'client') {
        // Clients don't need to see staff list or other clients
        apiRequests.unshift(Promise.resolve({ data: [] }));
        apiRequests.push(Promise.resolve({ data: [] }));
      } else if (currentUser?.role === 'manager' || currentUser?.role === 'superuser' || currentUser?.role === 'admin') {
        // Managers, superusers, and admins can see all staff and clients
        apiRequests.unshift(axiosInstance.get('/users/staff'));
        apiRequests.push(axiosInstance.get('/clients'));
      } else {
        // Default: no access
        // No access for this role
        apiRequests.unshift(Promise.resolve({ data: [] }));
        apiRequests.push(Promise.resolve({ data: [] }));
      }
      
      // Making API requests
      const [staffRes, servicesRes, keysRes, areasRes, clientsRes] = await Promise.all(apiRequests);
      
      logger.log('🔧 DEBUG: Staff API Response:', {
        status: staffRes.status,
        dataType: typeof staffRes.data,
        dataLength: Array.isArray(staffRes.data) ? staffRes.data.length : 'Not an array',
        data: staffRes.data
      });
      
      logger.log('🔧 DEBUG: Current user for staff list:', {
        exists: !!currentUser,
        id: currentUser?._id,
        name: currentUser?.name,
        role: currentUser?.role,
        fullObject: currentUser
      });
      
      logger.log('🔧 DEBUG: Setting staff list with data:', staffRes.data);
      setStaffList(staffRes.data || []);
      
      logger.log('🔧 DEBUG: Staff list should now contain:', staffRes.data?.length || 0, 'members');
      setServiceList(servicesRes.data);
      setClientList(clientsRes.data);
      setBookingKeys(keysRes.data.data || keysRes.data);
      setLocationAreas(areasRes.data.data || areasRes.data || []);
      setBookingCategories(keysRes.data.data || keysRes.data || []);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Error fetching calendar data');
      toast.error(`Failed to fetch data: ${errorMessage}`);
    }
  }, [currentUser]);

  // Filter bookings based on role and selected employees
  const filterBookings = useCallback(() => {
    logger.log('🔍 filterBookings called - currentUser:', currentUser?.name, 'role:', currentUser?.role, 'id:', currentUser?._id);
    logger.log('📊 Available data - bookings:', bookings.length, 'bookingAlerts:', bookingAlerts.length, 'leaveRequests:', leaveRequests.length);
    
    // Debug: Log sample booking data structure
    if (bookings.length > 0) {
      logger.log('📋 Sample booking data:', bookings[0]);
      logger.log('📋 Sample booking extendedProps:', bookings[0]?.extendedProps);
    }

     let filtered = [...bookings];
    
    if (hasRole(['staff']) && !hasRole(['manager', 'superuser', 'admin'])) {
          logger.log('👤 Filtering for staff user:', currentUser?.name, 'ID:', currentUser?._id);
          logger.log('🔍 Full currentUser object:', JSON.stringify(currentUser, null, 2));
          // Staff can only see their own bookings
          filtered = bookings.filter(booking => {
            const staffObj = booking.extendedProps.staff;
            const staffId = staffObj?._id || staffObj;
            let userId = currentUser?._id || currentUser?.id;
            
            // Handle MongoDB ObjectID properly
            if (userId && typeof userId === 'object' && userId._bsontype === 'ObjectID') {
              const buffer = userId.id;
              userId = Object.values(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
            }
            
            // Handle both string and ObjectId comparisons
            const matches = staffId === userId || String(staffId) === String(userId);
            logger.log('🔍 Booking staff check:');
            logger.log('  Staff Object:', staffObj);
            logger.log('  Staff ID:', staffId, 'type:', typeof staffId);
            logger.log('  User ID:', userId, 'type:', typeof userId);
            logger.log('  String comparison:', String(staffId) === String(userId));
            logger.log('  Match:', matches);
            return matches;
          });
          logger.log('✅ Staff bookings filtered:', filtered.length, 'out of', bookings.length, 'total bookings');
          // Add booking alerts for staff members
          logger.log('Adding booking alerts:', bookingAlerts.length, 'alerts');
          filtered = [...filtered, ...bookingAlerts];
          // Add leave requests for staff (they see their own leave requests)
          const staffLeaveRequests = leaveRequests.filter(leave => {
            const staffObj = leave.extendedProps.staff;
            const leaveStaffId = staffObj?._id || staffObj;
            let userId = currentUser?._id || currentUser?.id;
            
            // Handle MongoDB ObjectID properly
            if (userId && typeof userId === 'object' && userId._bsontype === 'ObjectID') {
              const buffer = userId.id;
              userId = Object.values(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
            }
            
            const matches = leaveStaffId === userId || String(leaveStaffId) === String(userId);
            logger.log('🍃 Leave request staff check:', {
              staffObj,
              leaveStaffId,
              userId,
              stringComparison: String(leaveStaffId) === String(userId),
              matches
            });
            return matches;
          });
          logger.log('Staff leave requests filtered:', staffLeaveRequests.length, 'requests');
          filtered = [...filtered, ...staffLeaveRequests];
          logger.log('Total filtered events for staff:', filtered.length);
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
    } else if (hasRole(['manager', 'superuser', 'admin'])) {
      // Managers see all bookings, alerts, and leave requests
      filtered = [...bookings, ...bookingAlerts, ...leaveRequests];
    }
    
    // Add resourceId to each event for staff column display
    filtered = filtered.map(event => {
      let staffId;
      
      if (event.extendedProps.type === 'booking-alert') {
        // Booking alerts are available to all staff, assign to current user for display
        staffId = currentUser._id;
      } else if (event.extendedProps.type === 'leave-request') {
        // Leave requests have staff object with _id
        staffId = event.extendedProps.staff?._id || event.extendedProps.staff;
      } else {
        // Regular bookings
        staffId = event.extendedProps.staff;
      }
      
      return {
        ...event,
        resourceId: staffId || currentUser._id
      };
    });
    

    
    setFilteredBookings(filtered);
  }, [bookings, bookingAlerts, leaveRequests, selectedEmployees, currentUser, hasRole]);
  
  // Get staff details by ID
  const getStaffById = (staffId) => {
    return staffList.find(staff => staff._id === staffId) || null;
  };
  
  // Render staff header for day/week views
  const renderStaffHeader = (date) => {
    if (currentView === 'month' || selectedEmployees.length === 0) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    
    return (
      <div className="staff-header mb-2">
        <div className="d-flex flex-wrap justify-content-around">
          {selectedEmployees.map((staffId, index) => {
            const staff = getStaffById(staffId);
            if (!staff) return null;
            
            // Get bookings for this staff on this date
            const staffBookings = filteredBookings.filter(booking => 
              booking.extendedProps.staff === staffId && 
              booking.start.toISOString().split('T')[0] === dateStr
            );
            
            // Calculate segment width based on number of staff (up to 5)
            const segmentWidth = 100 / Math.min(selectedEmployees.length, 4);
            
            return (
              <div 
                key={staffId} 
                className="text-center mb-2 staff-segment" 
                style={{ 
                  width: `${segmentWidth}%`,
                  minWidth: '80px',
                  borderLeft: index > 0 ? '1px dashed #ddd' : 'none'
                }}
                data-staff-id={staffId}
              >
                <img
                  src={staff.photo || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNlMGUwZTAiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzllOWU5ZSIvPjxlbGxpcHNlIGN4PSI1MCIgY3k9Ijc1IiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iIzllOWU5ZSIvPjwvc3ZnPg=='}
                  alt={staff.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '2px solid #f0f0f0',
                    objectFit: 'cover'
                  }}
                />
                <div className="mt-1 small fw-bold">{staff.name}</div>
                <div className="small text-muted">
                  {staffBookings.length > 0 ? `${staffBookings.length} booking(s)` : 'Available'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Handle view change
  const handleViewChange = (newView) => {
    setCurrentView(newView);
    saveViewPreferences(newView, selectedEmployees);

    // For managers, handle view-specific logic
    if (hasRole(['manager', 'superuser', 'admin'])) {
      if (newView === 'week' && selectedEmployees.length > 4) {
        const limitedSelection = selectedEmployees.slice(0, 4);
        setSelectedEmployees(limitedSelection);
        saveViewPreferences(newView, limitedSelection);
      }
    }
  };

  // Handle employee selection
  const handleEmployeeSelection = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      // Remove employee from selection
      const newSelection = selectedEmployees.filter(id => id !== employeeId);
      setSelectedEmployees(newSelection);
      saveViewPreferences(currentView, newSelection);
    } else {
      // Add employee to selection with view-based limits
      const maxSelection = currentView === 'week' ? 4 : staffList.length;
      
      if (selectedEmployees.length >= maxSelection) {
        const message = currentView === 'week' 
          ? 'Maximum 4 employees can be selected in week view'
          : `Maximum ${maxSelection} employees can be selected`;
        toast.warning(message);
        return;
      }
      
      const newSelection = [...selectedEmployees, employeeId];
      setSelectedEmployees(newSelection);
      saveViewPreferences(currentView, newSelection);
    }
  };
  
  // Render staff selection component
  const renderStaffSelection = () => {
    logger.log('🔍 DEBUG: renderStaffSelection called');
    logger.log('🔍 DEBUG: currentView:', currentView);
    logger.log('🔍 DEBUG: hasManagerRole:', hasManagerRole);
    logger.log('🔍 DEBUG: currentUser:', currentUser);
    logger.log('🔍 DEBUG: staffList:', staffList);
    
    // Don't show staff selection in month view or for staff/client users
    if (currentView === 'month' || !hasManagerRole) {
      logger.log('🔍 DEBUG: Not showing staff selection because:');
      logger.log('- currentView === month:', currentView === 'month');
      logger.log('- !hasManagerRole:', !hasManagerRole);
      return null;
    }
    
    const maxStaff = currentView === 'week' ? 4 : staffList.length;
    
    // Filter staff by location area or booking category
    const filteredStaff = selectedLocationArea === 'all' 
      ? staffList 
      : staffList.filter(staff => {
          if (selectedLocationArea.startsWith('category-')) {
            // Filter by booking category
            const categoryId = selectedLocationArea.replace('category-', '');
            return staff.bookingCategories && staff.bookingCategories.includes(categoryId);
          } else if (selectedLocationArea.startsWith('area-')) {
            // Filter by location area
            const areaId = selectedLocationArea.replace('area-', '');
            return staff.locationArea && staff.locationArea._id === areaId;
          } else {
            // Legacy support for direct area ID
            return staff.locationArea && staff.locationArea._id === selectedLocationArea;
          }
        });
    
    return (
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Staff Selection</h5>
            <small>{currentView === 'week' ? `(Select up to ${maxStaff} staff)` : '(Select any number of staff)'}</small>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Location Area Filter */}
          <div className="mb-3">
            <label className="form-label">Filter by Booking Categories - Location Areas:</label>
            <select 
              className="form-select form-select-sm" 
              style={{width: '250px'}}
              value={selectedLocationArea}
              onChange={(e) => setSelectedLocationArea(e.target.value)}
            >
              <option value="all">All Categories & Areas</option>
              {bookingCategories.length > 0 && (
                <optgroup label="Booking Categories">
                  {bookingCategories.map(category => (
                    <option key={`category-${category._id}`} value={`category-${category._id}`}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {locationAreas.length > 0 && (
                <optgroup label="Location Areas">
                  {locationAreas.map(area => (
                    <option key={`area-${area._id}`} value={`area-${area._id}`}>
                      {area.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          
          <div className="d-flex flex-wrap gap-2">
            {filteredStaff.map(staff => (
              <Button
                key={staff._id}
                variant={selectedEmployees.includes(staff._id) ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => handleEmployeeSelection(staff._id)}
                className="d-flex align-items-center"
              >
                <img
                  src={staff.photo || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNlMGUwZTAiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzllOWU5ZSIvPjxlbGxpcHNlIGN4PSI1MCIgY3k9Ijc1IiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iIzllOWU5ZSIvPjwvc3ZnPg=='}
                  alt={staff.name}
                  style={{
                    width: '25px',
                    height: '25px',
                    borderRadius: '50%',
                    marginRight: '5px',
                    objectFit: 'cover'
                  }}
                />
                {staff.name}
              </Button>
            ))}
          </div>
          
          {filteredStaff.length === 0 && selectedLocationArea !== 'all' && (
            <div className="text-muted mt-2">
              No staff found for the selected filter.
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  // Handle calendar settings save
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const form = e.target;
    const firstDay = parseInt(form.firstDay.value);
    const startTime = form.startTime.value;
    const endTime = form.endTime.value;
    
    saveCalendarSettings(firstDay, startTime, endTime);
    setShowSettingsModal(false);
    toast.success('Calendar settings updated');
  };

  useEffect(() => {
    // Ensure user is loaded and has a role before fetching any data
    if (isUserLoaded && currentUser && currentUser.role) {
      logger.log('✅ User is loaded, fetching data... Role:', currentUser.role, 'User:', JSON.stringify(currentUser));
      fetchData();
      fetchBookingAlerts();
      fetchLeaveRequests().then(leaveEvents => {
        setLeaveRequests(leaveEvents);
      }).catch(err => {
        logger.error("Error fetching leave requests in useEffect:", err);
        setLeaveRequests([]);
      });
    } else {
      logger.log('⏳ User not fully loaded yet, skipping initial data fetch. isUserLoaded:', isUserLoaded, 'currentUser:', currentUser);
    }
  }, [isUserLoaded, currentUser, fetchData, fetchBookingAlerts, fetchLeaveRequests]);

  // Refresh data when page becomes visible (e.g., returning from booking creation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isUserLoaded && currentUser && currentUser.role) {
        logger.log('📱 Page became visible, refreshing calendar data...');
        fetchData();
        fetchBookingAlerts();
        fetchLeaveRequests().then(leaveEvents => {
          setLeaveRequests(leaveEvents);
        }).catch(err => {
          logger.error("Error fetching leave requests on visibility change:", err);
        });
      }
    };

    const handleWindowFocus = () => {
      if (isUserLoaded && currentUser && currentUser.role) {
        logger.log('🔄 Window focused, refreshing calendar data...');
        fetchData();
        fetchBookingAlerts();
        fetchLeaveRequests().then(leaveEvents => {
          setLeaveRequests(leaveEvents);
        }).catch(err => {
          logger.error("Error fetching leave requests on window focus:", err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isUserLoaded, currentUser, fetchData, fetchBookingAlerts, fetchLeaveRequests]);

  // Periodic refresh to keep calendar data up-to-date
  useEffect(() => {
    if (!isUserLoaded || !currentUser || !currentUser.role) {
      return;
    }

    // Set up periodic refresh every 2 minutes
    const refreshInterval = setInterval(() => {
      logger.log('⏰ Periodic refresh of calendar data...');
      fetchData();
      fetchBookingAlerts();
      fetchLeaveRequests().then(leaveEvents => {
        setLeaveRequests(leaveEvents);
      }).catch(err => {
        logger.error("Error fetching leave requests on periodic refresh:", err);
      });
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isUserLoaded, currentUser, fetchData, fetchBookingAlerts, fetchLeaveRequests]);

  // Listen for booking creation events to refresh immediately
  useEffect(() => {
    const handleBookingCreated = () => {
      if (isUserLoaded && currentUser && currentUser.role) {
        logger.log('🆕 New booking created, refreshing calendar data...');
        fetchData();
        fetchBookingAlerts();
        fetchLeaveRequests().then(leaveEvents => {
          setLeaveRequests(leaveEvents);
        }).catch(err => {
          logger.error("Error fetching leave requests after booking creation:", err);
        });
      }
    };

    window.addEventListener('bookingCreated', handleBookingCreated);
    
    return () => {
      window.removeEventListener('bookingCreated', handleBookingCreated);
    };
  }, [isUserLoaded, currentUser, fetchData, fetchBookingAlerts, fetchLeaveRequests]);

  useEffect(() => {
    if (serviceList) {
      fetchBookings();
    }
  }, [serviceList, fetchBookings]);

  useEffect(() => {
    // Only load preferences after staff list is available to prevent race conditions
    if (staffList.length > 0) {
      loadViewPreferences();
    }
  }, [staffList, loadViewPreferences]);

  useEffect(() => {
    filterBookings();
  }, [bookings, bookingAlerts, leaveRequests, selectedEmployees, currentUser, filterBookings]);

  // Removed unused generateResources function

  // Get color based on booking status
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return '#9E9E9E'; // Gray
      case 'in-progress':
        return '#FBBC05'; // Yellow
      case 'completed':
        return '#34A853'; // Green
      case 'cancelled':
        return '#EA4335'; // Red
      default:
        return '#9E9E9E'; // Default gray
    }
  };
  
  // Removed unused hexToRgb function

  // Get contrasting text color for background
  const getContrastColor = (hexColor) => {
    // Default to black if no color provided
    if (!hexColor) return '#000000';
    
    // Remove # if present and ensure we have a valid hex color
    const cleanHex = hexColor.replace('#', '');
    if (cleanHex.length !== 6) return '#000000';
    
    // Convert hex to RGB
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    // Calculate luminance - brighter colors have higher values
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Use white text for dark backgrounds, black text for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Handle date click for creating new booking or view switching
  const handleDateClick = (arg) => {
    if (currentView === 'month') {
      // In month view, clicking a date switches to week view for that specific week
      const clickedDate = arg.date;
      handleViewChange('week');
      // Update selectedDate state for custom views
      setSelectedDate(clickedDate);
      // Navigate to the clicked date's week after a short delay to ensure calendar is re-rendered
      setTimeout(() => {
        if (calendarRef.current && clickedDate) {
          calendarRef.current.getApi().gotoDate(clickedDate);
        }
      }, 100);
      return;
    }
    
    if (!hasRole(['manager', 'superuser', 'admin'])) return;
    
    // Determine if a staff segment was clicked
    let staffId = null;
    let dateStr, timeStr;
    
    // Handle different argument formats
    if (arg.date && arg.staffId && arg.timeSlot) {
      // Called from custom views (CustomWeeklyView/CustomDayView)
      staffId = arg.staffId;
      const clickedDate = new Date(arg.date);
      dateStr = clickedDate.toISOString().split('T')[0];
      timeStr = arg.timeSlot;
    } else {
      // Called from FullCalendar default views
      // For week view, check if we're in a staff segment
      if (currentView === 'timeGridWeek' && arg.jsEvent && arg.jsEvent.target) {
        // Find the closest staff segment
        const segment = arg.jsEvent.target.closest('.staff-segment');
        if (segment && segment.dataset.staffId) {
          staffId = segment.dataset.staffId;
        }
      }
      
      // For day view, check which segment was clicked
      if (currentView === 'timeGridDay' && arg.jsEvent && arg.jsEvent.target) {
        const rect = arg.jsEvent.target.closest('.fc-timegrid-col-events').getBoundingClientRect();
        const clickX = arg.jsEvent.clientX - rect.left;
        const segmentCount = Math.min(selectedEmployees.length, 4);
        
        if (segmentCount > 0) {
          const segmentWidth = rect.width / segmentCount;
          const segmentIndex = Math.floor(clickX / segmentWidth);
          
          if (segmentIndex >= 0 && segmentIndex < selectedEmployees.length) {
            staffId = selectedEmployees[segmentIndex];
          }
        }
      }
      
      // Format time from the click or use default
      timeStr = (arg.dateStr && arg.dateStr.includes('T')) ? 
        arg.dateStr.split('T')[1].substring(0, 5) : 
        '09:00';
      
      dateStr = arg.dateStr ? arg.dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
    }
    
    // Check for leave request conflicts before opening booking modal
    if (staffId) {
      const clickedDateTime = new Date(`${dateStr}T${timeStr}`);
      const endDateTime = new Date(`${dateStr}T${parseInt(timeStr.split(':')[0]) + 1}:${timeStr.split(':')[1]}`);
      
      // Check if the selected staff has any pending or approved leave requests
      const conflictingLeave = leaveRequests.find(leaveRequest => {
        if (
          leaveRequest.extendedProps.type === 'leave-request' &&
          (leaveRequest.extendedProps.status === 'pending' || leaveRequest.extendedProps.status === 'approved') &&
          leaveRequest.extendedProps.staff?._id === staffId
        ) {
          const leaveStart = new Date(leaveRequest.start);
          // Use original end date for accurate conflict detection
          const leaveEnd = leaveRequest.extendedProps.originalEndDate ? 
            new Date(leaveRequest.extendedProps.originalEndDate) : 
            new Date(leaveRequest.end);
          
          // Check if the clicked time overlaps with the leave request
          return clickedDateTime < leaveEnd && endDateTime > leaveStart;
        }
        return false;
      });
      
      if (conflictingLeave) {
        toast.error(`Cannot create booking: ${conflictingLeave.extendedProps.staffName} has a ${conflictingLeave.extendedProps.status} leave request during this time.`);
        return;
      }
    }
    
    setModalType('create');
    setFormData({
      ...formData,
      staff: staffId || formData.staff,
      startTime: `${dateStr}T${timeStr}`,
      endTime: `${dateStr}T${parseInt(timeStr.split(':')[0]) + 1}:${timeStr.split(':')[1]}`
    });
    setShowModal(true);
  };

  // Handle event click for viewing/editing booking
  const handleEventClick = (arg) => {
    const { id, title, extendedProps, start, end } = arg.event;
    
    // Check if this is a booking alert
    if (extendedProps.type === 'booking-alert') {
      // For staff members, show accept/reject modal
      if (currentUser && currentUser.role === 'staff') {
        setSelectedAlert({
          id: extendedProps.alertId, // Use the actual alert _id, not the prefixed calendar event id
          title,
          description: extendedProps.description,
          startTime: start,
          endTime: end,
          client: extendedProps.client,
          service: extendedProps.service,
          location: extendedProps.location
        });
        setShowAlertModal(true);
        return;
      } else {
        // For managers, navigate to booking alerts page
        navigate('/booking-alerts');
        return;
      }
    }
    
    // Set the selected booking data
    setSelectedBooking({
      id,
      title,
      description: extendedProps.description,
      startTime: start,
      endTime: end,
      staff: extendedProps.staff,
      client: extendedProps.client,
      location: extendedProps.location,
      status: extendedProps.status,
      service: extendedProps.service
    });
    
    // Check if this is a leave request - they cannot be edited through booking edit page
    if (extendedProps.type === 'leave-request') {
      // For leave requests, show a read-only modal or navigate to leave requests page
      toast.info('Leave requests can be managed from the Leave Requests page');
      if (hasRole(['manager', 'superuser', 'admin'])) {
        navigate('/leave-requests');
      }
      return;
    }
    
    // For managers and superusers, navigate to edit page (only for bookings)
    if (hasRole(['manager', 'superuser', 'admin'])) {
      navigate(`/bookings/edit/${id}`);
      return;
    } else {
      // For regular staff, just view
      setModalType('view');
      setShowModal(true);
    }
    
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // If service is selected, set default end time (1 hour) if not already set
      if (name === 'service' && value) {
        const selectedService = serviceList.find(s => s._id === value);
        if (selectedService && formData.startTime && !formData.endTime) {
          const startTime = new Date(formData.startTime);
          const endTime = new Date(startTime.getTime() + 60 * 60000); // Default 1 hour duration
          setFormData(prev => ({
            ...prev,
            endTime: endTime.toISOString().slice(0, 16)
          }));
        }
      }
      
      // If start time changes and no end time is set, set default end time (1 hour)
      if (name === 'startTime' && value && !formData.endTime) {
        const startTime = new Date(value);
        const endTime = new Date(startTime.getTime() + 60 * 60000); // Default 1 hour duration
        setFormData(prev => ({
          ...prev,
          endTime: endTime.toISOString().slice(0, 16)
        }));
        // After updating end time, check staff availability
        setTimeout(checkStaffAvailability, 100);
      }
    }
  };
  
  // Check staff availability for selected time slot
  const checkStaffAvailability = async () => {
    if (!formData.startTime || !formData.endTime) {
      setAvailableStaff(staffList);
      return;
    }
    
    try {
      // Filter out staff who have conflicting bookings
      const conflictingBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);
        const requestStart = new Date(formData.startTime);
        const requestEnd = new Date(formData.endTime);
        
        return (
          (requestStart < bookingEnd && requestEnd > bookingStart) &&
          booking.extendedProps.status !== 'cancelled'
        );
      });
      
      const unavailableStaffIds = conflictingBookings.map(booking => booking.extendedProps.staff);
      const available = staffList.filter(staff => !unavailableStaffIds.includes(staff._id));
      
      setAvailableStaff(available);
    } catch (err) {
      logger.error('Error checking staff availability:', err);
      setAvailableStaff(staffList);
    }
  };
  
  // Handle booking step navigation
  const handleNextStep = () => {
    if (bookingStep === 1 && formData.bookingKey) {
      setBookingStep(2);
    } else if (bookingStep === 2 && formData.service) {
      setBookingStep(3);
    } else if (bookingStep === 3 && formData.client) {
      setBookingStep(4);
      // Check staff availability when reaching step 4, especially for pre-populated times
      setTimeout(checkStaffAvailability, 100);
    }
  };
  
  const handlePrevStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    }
  };
  
  const resetBookingForm = () => {
    setFormData({
      bookingKey: '',
      service: '',
      client: '',
      staff: '',
      startTime: '',
      endTime: '',
      location: {
        address: '',
        city: '',
        postcode: ''
      },
      locationArea: '',
      categories: [],
      notes: '',
      isRecurring: false,
      recurringDays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false
      },
      recurringWeeks: 0
    });
    setBookingStep(1);
    setAvailableStaff([]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.staff) {
      alert('Please select a staff member before creating the booking.');
      return;
    }
    
    if (!formData.startTime || !formData.endTime) {
      alert('Please select both start and end times for the booking.');
      return;
    }
    
    try {
      const selectedBookingKey = bookingKeys.find(k => k._id === formData.bookingKey);
      // Removed unused selectedService variable
      const selectedClient = clientList.find(c => c._id === formData.client);
      
      // Removed unused token variable
      
      // Create array of bookings to submit
      const bookingsToCreate = [];
      
      // Base booking data
      const baseBookingData = {
        title: `${selectedBookingKey.name} - ${selectedClient.firstName && selectedClient.lastName ? `${selectedClient.firstName} ${selectedClient.lastName}` : selectedClient.name}`,
        description: formData.notes,
        bookingKey: formData.bookingKey,
        service: formData.service,
        client: formData.client,
        staff: formData.staff,
        location: formData.location,
        locationArea: formData.locationArea,
        notes: formData.notes,
        manager: currentUser._id
      };
      
      // If not recurring, just create a single booking
      if (!formData.isRecurring) {
        bookingsToCreate.push({
          ...baseBookingData,
          startTime: formData.startTime,
          endTime: formData.endTime
        });
      } else {
        // Get the day of the week from the selected start date (0 = Sunday, 1 = Monday, etc.)
        const startDate = new Date(formData.startTime);
        const startDay = startDate.getDay();
        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();
        
        // Calculate duration in minutes
        const endDate = new Date(formData.endTime);
        const durationMinutes = (endDate - startDate) / (1000 * 60);
        
        // Get the start of the week (Monday)
        const startOfWeek = new Date(startDate);
        startOfWeek.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Map day names to day numbers (1 = Monday, 5 = Friday)
        const dayMap = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5
        };
        
        // Create bookings for selected days in current and future weeks
        for (let week = 0; week <= formData.recurringWeeks; week++) {
          // For each selected day of the week
          Object.entries(formData.recurringDays).forEach(([day, isSelected]) => {
            if (isSelected) {
              // Calculate the date for this day in this week
              const dayNumber = dayMap[day];
              const bookingDate = new Date(startOfWeek);
              bookingDate.setDate(startOfWeek.getDate() + dayNumber - 1 + (week * 7));
              
              // Allow all dates for recurring bookings as specified by user
              
              // Set the time to match the original booking
              bookingDate.setHours(startHour, startMinute, 0, 0);
              
              // Calculate end time
              const bookingEndDate = new Date(bookingDate.getTime() + durationMinutes * 60000);
              
              // Create booking for this date
              bookingsToCreate.push({
                ...baseBookingData,
                startTime: bookingDate.toISOString(),
                endTime: bookingEndDate.toISOString()
              });
            }
          });
        }
      }
      
      // Check for booking conflicts
      const hasConflicts = await checkBookingConflicts(bookingsToCreate);
      
      if (hasConflicts) {
        toast.error('Some bookings overlap with existing appointments. Please adjust your selection.');
        return;
      }
      
      // Create all bookings
      const promises = bookingsToCreate.map(booking => 
        axiosInstance.post('/bookings', booking)
      );
      
      await Promise.all(promises);
      
      toast.success(`${bookingsToCreate.length} booking(s) created successfully`);
      setShowModal(false);
      
      // Refresh calendar with current visible date range
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        const currentView = calendarApi.view;
        const visibleStart = currentView.activeStart;
        const visibleEnd = currentView.activeEnd;
        
        // Fetch bookings for the currently visible date range
        fetchBookings(visibleStart.toISOString(), visibleEnd.toISOString());
      } else {
        // Fallback to default fetch if calendar ref is not available
        fetchBookings();
      }
      
      resetBookingForm();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Failed to create booking';
      toast.error(errorMsg);
      logger.error(err);
    }
  };
  
  // Check for booking conflicts
  const checkBookingConflicts = async (bookingsToCheck) => {
    try {
      // Get all existing bookings
      const existingBookings = bookings.filter(b => b.extendedProps.status !== 'cancelled');
      
      // Check each new booking against existing bookings and leave requests
      for (const newBooking of bookingsToCheck) {
        const newStart = new Date(newBooking.startTime);
        const newEnd = new Date(newBooking.endTime);
        
        // Check against existing bookings
        for (const existing of existingBookings) {
          const existingStart = new Date(existing.start);
          const existingEnd = new Date(existing.end);
          
          // Check if this booking overlaps with an existing one for the same staff
          if (
            existing.extendedProps.staff === newBooking.staff &&
            newStart < existingEnd && 
            newEnd > existingStart
          ) {
            return true; // Conflict found
          }
        }
        
        // Check against leave requests (pending and approved)
        for (const leaveRequest of leaveRequests) {
          if (
            leaveRequest.extendedProps.type === 'leave-request' &&
            (leaveRequest.extendedProps.status === 'pending' || leaveRequest.extendedProps.status === 'approved')
          ) {
            const leaveStart = new Date(leaveRequest.start);
            // Use original end date for accurate conflict detection
            const leaveEnd = leaveRequest.extendedProps.originalEndDate ? 
              new Date(leaveRequest.extendedProps.originalEndDate) : 
              new Date(leaveRequest.end);
            
            // Check if the booking staff matches the leave request staff
            if (
              leaveRequest.extendedProps.staff?._id === newBooking.staff &&
              newStart < leaveEnd && 
              newEnd > leaveStart
            ) {
              toast.error(`Cannot create booking: ${leaveRequest.extendedProps.staffName} has a ${leaveRequest.extendedProps.status} leave request during this time.`);
              return true; // Conflict found with leave request
            }
          }
        }
      }
      
      return false; // No conflicts
    } catch (error) {
      logger.error('Error checking booking conflicts:', error);
      return true; // Assume conflict on error to be safe
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    try {
      // Removed unused token variable
      
      await axiosInstance.put(`/bookings/${selectedBooking.id}`, 
        { status: 'cancelled' }
      );
      toast.success('Booking cancelled successfully');
      setShowModal(false);
      
      // Remove the cancelled booking from the state
      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== selectedBooking.id));
      
    } catch (err) {
      toast.error('Failed to cancel booking');
      logger.error(err);
    }
  };

  // Handle booking deletion
  const handleDeleteBooking = async () => {
    try {
      await axiosInstance.delete(`/bookings/${selectedBooking.id}`);
      toast.success('Booking deleted successfully');
      setShowModal(false);
      
      // Remove the deleted booking from the state
      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== selectedBooking.id));
      
    } catch (err) {
      toast.error('Failed to delete booking');
      logger.error(err);
    }
  };

  // Handle booking alert accept/reject actions
  const handleAlertAction = async (action) => {
    if (!selectedAlert) return;
    
    try {
      const endpoint = action === 'accept' ? 'claim' : 'reject';
      
      await axiosInstance.put(`/booking-alerts/${selectedAlert.id}/${endpoint}`);
      
      if (action === 'accept') {
        toast.success('Booking alert accepted! The manager will be notified to confirm.');
      } else {
        toast.success('Booking alert rejected.');
      }
      
      setShowAlertModal(false);
      setSelectedAlert(null);
      
      // Refresh booking alerts to reflect the change
      fetchBookingAlerts();
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${action} booking alert`;
      toast.error(errorMsg);
      logger.error(err);
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Add the custom styles */}
      <style>{calendarStyles}</style>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Booking Calendar</h4>
                {hasRole(['manager', 'superuser', 'admin']) && (
                  <Button variant="primary" onClick={() => {
                    resetBookingForm();
                    setModalType('create');
                    setShowModal(true);
                  }}>
                    Create Booking
                  </Button>
                )}
              </div>
              
              {/* View Controls */}
              <div className="d-flex justify-content-between align-items-center">
                <ButtonGroup>
                  <Button 
                    variant={currentView === 'month' ? 'primary' : 'outline-primary'}
                    onClick={() => handleViewChange('month')}
                  >
                    Month
                  </Button>
                  <Button 
                    variant={currentView === 'week' ? 'primary' : 'outline-primary'}
                    onClick={() => handleViewChange('week')}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={currentView === 'day' ? 'primary' : 'outline-primary'}
                    onClick={() => handleViewChange('day')}
                  >
                    Day
                  </Button>
                </ButtonGroup>
                
                {/* Employee Selection for Managers */}
                {hasRole(['manager', 'superuser', 'admin']) && currentView !== 'month' && (
                  <div className="d-flex align-items-center mb-2">
                    <span className="me-2">Employees ({staffList.length} available):</span>
                    <div className="d-flex flex-wrap gap-1">
                      {staffList.map(staff => (
                        <Badge
                          key={staff._id}
                          bg={selectedEmployees.includes(staff._id) ? 'primary' : 'secondary'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleEmployeeSelection(staff._id)}
                        >
                          {staff.name}
                        </Badge>
                      ))}
                    </div>
                    {currentView === 'week' && (
                      <small className="text-muted ms-2">
                        (Max 4 employees)
                      </small>
                    )}
                  </div>
                )}
                
                {/* Calendar Settings */}
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="mb-2"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <i className="fas fa-cog me-1"></i> Calendar Settings
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Staff Selection Component */}
              {hasRole(['manager', 'superuser', 'admin']) && currentView !== 'month' && renderStaffSelection()}
              
              {/* Conditional rendering: Custom Views or FullCalendar */}
              {/* Removed unused useFullCalendar variable logic */}
              {currentView === 'week' && hasRole(['manager', 'superuser', 'admin']) && selectedEmployees.length > 0 ? (
                <CustomWeeklyView
                  currentDate={selectedDate}
                  selectedEmployees={selectedEmployees.map(staffId => {
                    const staff = staffList.find(s => s._id === staffId);
                    return staff ? { id: staff._id, name: staff.name, photo: staff.photo } : null;
                  }).filter(Boolean)}
                  bookings={filteredBookings}
                  leaveRequests={leaveRequests}
                  bookingAlerts={bookingAlerts}
                  businessHours={businessHours}
                  onTimeSlotClick={handleDateClick}
                  onEventClick={handleEventClick}
                  onDateChange={setSelectedDate}
                />
              ) : currentView === 'day' && hasRole(['manager', 'superuser', 'admin']) && selectedEmployees.length > 0 ? (
                <CustomDayView
                  currentDate={selectedDate}
                  selectedEmployees={selectedEmployees.map(staffId => {
                    const staff = staffList.find(s => s._id === staffId);
                    return staff ? { id: staff._id, name: staff.name, photo: staff.photo } : null;
                  }).filter(Boolean)}
                  bookings={filteredBookings}
                  leaveRequests={leaveRequests}
                  bookingAlerts={bookingAlerts}
                  businessHours={businessHours}
                  onTimeSlotClick={handleDateClick}
                  onEventClick={handleEventClick}
                  onDateChange={setSelectedDate}
                />
              ) : (
                <FullCalendar
                ref={calendarRef}
                key={`${currentView}-${firstDay}-${businessHours.startTime}-${businessHours.endTime}-${selectedEmployees.join(',')}`} // Force re-render when settings change
                plugins={[
                  dayGridPlugin, 
                  timeGridPlugin, 
                  interactionPlugin
                ]}
                initialView={
                  currentView === 'month' ? 'dayGridMonth' :
                  currentView === 'week' ? 'timeGridWeek' :
                  'timeGridDay'
                }
                viewDidMount={(info) => {
                  // View mounted successfully
                  
                  // For staff users, sync the currentView state with the actual calendar view
                  if (!hasRole(['manager', 'superuser', 'admin'])) {
                    const viewType = info.view.type === 'dayGridMonth' ? 'month' :
                                    info.view.type === 'timeGridWeek' ? 'week' : 'day';
                    if (viewType !== currentView) {
                      setCurrentView(viewType);
                    }
                  }
                }}
                firstDay={firstDay}
                slotMinTime={businessHours.startTime}
                slotMaxTime={businessHours.endTime}
                allDaySlot={true}
                eventDisplay="block"
                dayMaxEventRows={false}
                displayEventTime={true}
                displayEventEnd={false}
                eventOverlap={false}
                slotEventOverlap={false}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }}
                slotLabelFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }}
                slotDuration="00:15:00"
                snapDuration="00:15:00"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                locale={{
                  code: 'en-US',
                  week: {
                    dow: firstDay, // First day of week from your existing setting
                    doy: 4 // First week of year that contains Jan 4th
                  },
                  buttonText: {
                    today: 'Today'
                  },
                  // Format for the title in the header (Sep 1-7 2025 → 1-7 Sep 2025)
                  titleFormat: { 
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  },
                  // Format for day headers (just show day of week for month view)
                  dayHeaderFormat: { 
                    weekday: 'short'
                  }
                }}
                dayCellClassNames={(arg) => {
                  const date = arg.date;
                  const day = date.getDay();
                  const dateStr = date.toISOString().split('T')[0];
                  
                  const classes = [];
                  
                  // Add weekend class
                  if (day === 0 || day === 6) { // 0 = Sunday, 6 = Saturday
                    classes.push('weekend-day');
                  }
                  
                  // Add bank holiday class
                  if (UK_BANK_HOLIDAYS_2023.includes(dateStr) || UK_BANK_HOLIDAYS_2024.includes(dateStr)) {
                    classes.push('bank-holiday');
                  }
                  
                  return classes;
                }}
                events={(() => {
                  // Use only filteredBookings as it already includes filtered alerts and leave requests
                  logger.log('🗓️ FullCalendar Events Debug:');
                  logger.log('filteredBookings (includes all filtered events):', filteredBookings.length, filteredBookings);
                  logger.log('🗓️ Raw state arrays:');
                  logger.log('  - bookings:', bookings.length, bookings);
                  logger.log('  - bookingAlerts:', bookingAlerts.length, bookingAlerts);
                  logger.log('  - leaveRequests:', leaveRequests.length, leaveRequests);
                  logger.log('🗓️ Current user for filtering:', currentUser?._id, currentUser?.name);
                  
                  // Additional debugging: Check if events have proper structure
                  if (filteredBookings.length > 0) {
                    logger.log('🗓️ Sample filtered event:', filteredBookings[0]);
                    logger.log('🗓️ Event types in filteredBookings:', filteredBookings.map(e => e.extendedProps?.type || 'booking'));
                  }
                  
                  return filteredBookings;
                })()}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="auto"
                dayMaxEvents={currentView === 'month' ? 10 : true}
                selectable={currentView !== 'month'}
                selectMirror={true}
                eventContent={(arg) => {
                  const eventType = arg.event.extendedProps.type || 'booking';
                  const view = arg.view.type;
                  
                  // Handle leave request events
                  if (eventType === 'leave-request') {
                    const staffName = arg.event.extendedProps.staffName || 'Staff';
                    const status = arg.event.extendedProps.status || 'pending';
                    const reason = arg.event.extendedProps.reason || 'Leave Request';
                    
                    if (view === 'timeGridWeek' || view === 'timeGridDay') {
                      return (
                        <div className="fc-event-content" style={{
                          height: '100%', 
                          overflow: 'hidden', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center',
                          padding: '4px',
                          fontSize: '12px',
                          lineHeight: '1.2',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontWeight: 'bold',
                            marginBottom: '2px'
                          }}>🏖️ {staffName}</div>
                          <div style={{
                            fontSize: '10px',
                            opacity: 0.9
                          }}>{reason}</div>
                          <div style={{
                            fontSize: '9px',
                            opacity: 0.8,
                            textTransform: 'uppercase'
                          }}>{status}</div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="fc-event-content p-1">
                          <div className="fc-event-title">🏖️ {staffName} - {status}</div>
                        </div>
                      );
                    }
                  }
                  
                  // Handle booking alert events
                  if (eventType === 'booking-alert') {
                    if (view === 'timeGridWeek' || view === 'timeGridDay') {
                      return (
                        <div className="fc-event-content" style={{
                          height: '100%', 
                          overflow: 'hidden', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center',
                          padding: '4px',
                          fontSize: '12px',
                          lineHeight: '1.2',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontWeight: 'bold'
                          }}>🚨 {arg.event.title}</div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="fc-event-content p-1">
                          <div className="fc-event-title">{arg.event.title}</div>
                        </div>
                      );
                    }
                  }
                  
                  // Handle regular booking events
                  const clientName = arg.event.extendedProps.clientName || 'Unknown Client';
                  const serviceName = arg.event.extendedProps.serviceName || 'Unknown Service';
                  // Removed unused staffName variable
                  const startTime = arg.event.start ? new Date(arg.event.start).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : '';
                  const endTime = arg.event.end ? new Date(arg.event.end).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : '';
                  
                  // Format location properly to avoid rendering objects directly
                  let locationDisplay = '';
                  const location = arg.event.extendedProps.location;
                  
                  if (location) {
                    if (typeof location === 'object') {
                      // Join non-empty address parts with commas
                      const addressParts = [
                        location.address,
                        location.city,
                        location.postcode
                      ].filter(Boolean);
                      
                      locationDisplay = addressParts.length > 0 ? addressParts.join(', ') : '';
                    } else {
                      // If location is a string, use it directly
                      locationDisplay = location;
                    }
                  }
                  
                  // Different display for timeGrid views (day/week) vs month view
                  if (view === 'timeGridWeek' || view === 'timeGridDay') {
                    return (
                      <div className="fc-event-content" style={{
                        height: '100%', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'flex-start',
                        padding: '2px 4px',
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        <div className="fc-event-title" style={{
                          fontWeight: 'bold',
                          marginBottom: '1px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{clientName}</div>
                        <div className="fc-event-service" style={{
                          fontSize: '11px',
                          marginBottom: '1px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.9
                        }}>{serviceName}</div>
                        <div className="fc-event-time" style={{
                          fontSize: '10px',
                          marginBottom: '1px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.8
                        }}>{startTime} - {endTime}</div>
                        {locationDisplay && (
                          <div className="fc-event-location" style={{
                            fontSize: '10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            opacity: 0.7
                          }}>{locationDisplay}</div>
                        )}
                      </div>
                    );
                  } else {
                    // Simplified view for month
                    return (
                      <div className="fc-event-content p-1">
                        <div className="fc-event-title">{arg.event.title}</div>
                      </div>
                    );
                  }
                }}
                eventDidMount={(info) => {
                  // Force events to fill their complete time duration in day view
                  if (info.view.type === 'timeGridDay') {
                    const eventEl = info.el;
                    const harnessEl = eventEl.closest('.fc-timegrid-event-harness');
                    
                    if (harnessEl) {
                      // Force the harness to fill the complete time slot
                      harnessEl.style.height = '100%';
                      harnessEl.style.top = '0';
                      harnessEl.style.bottom = '0';
                      
                      // Force the event element to fill the harness
                      eventEl.style.height = '100%';
                      eventEl.style.top = '0';
                      eventEl.style.bottom = '0';
                      
                      // Force the event main content to fill
                      const mainEl = eventEl.querySelector('.fc-event-main');
                      if (mainEl) {
                        mainEl.style.height = '100%';
                        mainEl.style.display = 'flex';
                        mainEl.style.flexDirection = 'column';
                      }
                    }
                  }
                }}
                eventBackgroundColor={(info) => {
                  // Use service color as primary color
                  const serviceId = info.event.extendedProps.service;
                  const service = serviceList.find(s => s._id === serviceId);
                  return service?.color || 'transparent'; // No default color
                }}
                eventBorderColor="transparent"
                eventTextColor="#000"
                eventOpacity={1.0} // Full opacity for solid block appearance
                datesSet={(arg) => {
                  // Update date range and fetch bookings for the visible date range
                  const visibleStart = new Date(arg.start);
                  const visibleEnd = new Date(arg.end);
                  
                  // Format dates for API
                  const startDate = visibleStart.toISOString();
                  const endDate = visibleEnd.toISOString();
                  
                  // Fetch bookings for this date range (debounced)
                  debouncedFetchBookings(startDate, endDate);
                }}

                dayHeaderDidMount={currentView === 'day' ? (arg) => {
                  // Add staff header for day view
                  if (selectedEmployees.length > 0) {
                    const headerEl = document.createElement('div');
                    headerEl.className = 'staff-day-header';
                    headerEl.style.padding = '10px';
                    headerEl.style.marginBottom = '10px';
                    headerEl.style.borderBottom = '1px solid #eee';
                    
                    // Render the staff header into the element
                    const root = ReactDOM.createRoot(headerEl);
                    root.render(renderStaffHeader(arg.date));
                    
                    // Insert after the day header
                    arg.el.after(headerEl);
                    
                    // Staff columns are handled by resource view
                  }
                } : undefined}
              />
              )}
              
              {/* Month view message */}
              {currentView === 'month' && (
                <div className="text-center mt-3">
                  <p className="text-muted">
                    Click on a date to view bookings in week view, or switch to week/day view to see detailed bookings.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create/View Booking Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'create' ? 'Create New Booking' : 'Booking Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalType === 'create' && hasRole(['manager', 'superuser', 'admin']) ? (
            <>
              {/* Step Progress Indicator */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>
                    <Badge bg={bookingStep >= 1 ? 'primary' : 'secondary'}>1</Badge>
                    <span className="ms-2">Booking Key</span>
                  </div>
                  <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>
                    <Badge bg={bookingStep >= 2 ? 'primary' : 'secondary'}>2</Badge>
                    <span className="ms-2">Select Service</span>
                  </div>
                  <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>
                    <Badge bg={bookingStep >= 3 ? 'primary' : 'secondary'}>3</Badge>
                    <span className="ms-2">Choose Client</span>
                  </div>
                  <div className={`step ${bookingStep >= 4 ? 'active' : ''}`}>
                    <Badge bg={bookingStep >= 4 ? 'primary' : 'secondary'}>4</Badge>
                    <span className="ms-2">Book Staff & Time</span>
                  </div>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                {/* Step 1: Booking Key Selection */}
                {bookingStep === 1 && (
                  <div>
                    <h5 className="mb-3">Select a Booking Key</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking Key</Form.Label>
                      <Form.Select
                        name="bookingKey"
                        value={formData.bookingKey}
                        onChange={handleChange}
                        required
                        size="lg"
                      >
                        <option value="">Choose a booking key...</option>
                        {bookingKeys.map(key => (
                          <option key={key._id} value={key._id}>
                            {key.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                )}

                {/* Step 2: Service Selection */}
                {bookingStep === 2 && (
                  <div>
                    <h5 className="mb-3">Select a Service</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Available Services</Form.Label>
                      <Form.Select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        required
                        size="lg"
                      >
                        <option value="">Choose a service...</option>
                        {serviceList.map(service => (
                          <option key={service._id} value={service._id}>
                            {service.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    {formData.service && (
                      <div className="mt-3 p-3 bg-light rounded">
                        {(() => {
                          const selectedService = serviceList.find(s => s._id === formData.service);
                          return selectedService ? (
                            <div>
                              <h6>{selectedService.name}</h6>
                              {selectedService.description && (
                                <p className="mb-0"><strong>Description:</strong> {selectedService.description}</p>
                              )}
                            </div>
                          ) : null;
                        })()} 
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Client Selection */}
                {bookingStep === 3 && (
                  <div>
                    <h5 className="mb-3">Choose Client</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Client</Form.Label>
                      <Form.Select
                        name="client"
                        value={formData.client}
                        onChange={handleChange}
                        required
                        size="lg"
                      >
                        <option value="">Choose a client...</option>
                        {clientList.map(client => (
                          <option key={client._id} value={client._id}>
                            {client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : client.name} - {client.email}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    {formData.client && (
                      <div className="mt-3 p-3 bg-light rounded">
                        {(() => {
                          const selectedClient = clientList.find(c => c._id === formData.client);
                          return selectedClient ? (
                            <div>
                              <h6>{selectedClient.firstName && selectedClient.lastName ? `${selectedClient.firstName} ${selectedClient.lastName}` : selectedClient.name}</h6>
                              <p className="mb-1"><strong>Email:</strong> {selectedClient.email}</p>
                              {selectedClient.phone && (
                                <p className="mb-1"><strong>Phone:</strong> {selectedClient.phone}</p>
                              )}
                              {selectedClient.address?.city && (
                                <p className="mb-0"><strong>Location:</strong> {selectedClient.address.city}, {selectedClient.address.postcode}</p>
                              )}
                            </div>
                          ) : null;
                        })()} 
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Staff & Time Selection */}
                {bookingStep === 4 && (
                  <div>
                    <h5 className="mb-3">Book Staff & Time</h5>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Time *</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={(e) => {
                              handleChange(e);
                              setTimeout(checkStaffAvailability, 100);
                            }}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Time *</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={(e) => {
                              handleChange(e);
                              setTimeout(checkStaffAvailability, 100);
                            }}
                            required
                          />
                          <Form.Text className="text-muted">
                            Select the end time for this appointment
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Available Staff</Form.Label>
                      <Form.Select
                        name="staff"
                        value={formData.staff}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select available staff...</option>
                        {availableStaff.map(staff => (
                          <option key={staff._id} value={staff._id}>
                            {staff.name}
                          </option>
                        ))}
                      </Form.Select>
                      {formData.startTime && availableStaff.length === 0 && (
                        <Form.Text className="text-danger">
                          No staff available for the selected time slot. Please choose a different time.
                        </Form.Text>
                      )}
                    </Form.Group>



                    <Form.Group className="mb-3">
                      <Form.Label>Location Area</Form.Label>
                      <Form.Select
                        name="locationArea"
                        value={formData.locationArea}
                        onChange={handleChange}
                      >
                        <option value="">Select Location Area</option>
                        {locationAreas.map((area) => (
                          <option key={area._id || area} value={area._id || area}>
                            {area.name || area}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>



                    <Form.Group className="mb-3">
                      <Form.Label>Additional Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Any additional notes for this booking..."
                      />
                    </Form.Group>

                    <hr className="my-4" />
                    
                    <h6 className="mb-3">Recurring Booking Options</h6>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="isRecurring"
                        label="Make this a recurring booking"
                        checked={formData.isRecurring}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let updatedFormData = {
                            ...formData,
                            isRecurring: isChecked
                          };
                          
                          // If checking the recurring option and we have a start time, auto-select the day
                          if (isChecked && formData.startTime) {
                            const startDate = new Date(formData.startTime);
                            const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                            
                            // Map day numbers to day names
                            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            const selectedDayName = dayNames[dayOfWeek];
                            
                            // Only auto-select if it's a weekday (Monday-Friday)
                            if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(selectedDayName)) {
                              updatedFormData.recurringDays = {
                                ...formData.recurringDays,
                                [selectedDayName]: true
                              };
                            }
                          }
                          
                          // If unchecking, reset all recurring days
                          if (!isChecked) {
                            updatedFormData.recurringDays = {
                              monday: false,
                              tuesday: false,
                              wednesday: false,
                              thursday: false,
                              friday: false
                            };
                          }
                          
                          setFormData(updatedFormData);
                        }}
                      />
                    </Form.Group>
                    
                    {formData.isRecurring && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Select Days of the Week</Form.Label>
                          <div className="d-flex flex-wrap gap-2">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                              <Form.Check
                                key={day}
                                inline
                                type="checkbox"
                                id={`day-${day}`}
                                label={day.charAt(0).toUpperCase() + day.slice(1)}
                                checked={formData.recurringDays[day]}
                                onChange={(e) => handleChange({
                                  target: {
                                    name: `recurringDays.${day}`,
                                    value: e.target.checked
                                  }
                                })}
                                className="me-3 mb-2"
                              />
                            ))}
                          </div>
                          <Form.Text className="text-muted">
                            Select additional days in the current week for this booking
                          </Form.Text>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Repeat for Additional Weeks</Form.Label>
                          <Form.Select
                            name="recurringWeeks"
                            value={formData.recurringWeeks}
                            onChange={handleChange}
                          >
                            <option value="0">Current week only</option>
                            <option value="1">Repeat for 1 more week</option>
                            <option value="2">Repeat for 2 more weeks</option>
                            <option value="3">Repeat for 3 more weeks</option>
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Repeat this booking pattern for up to 3 additional weeks
                          </Form.Text>
                        </Form.Group>
                      </>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between">
                  <div>
                    {bookingStep > 1 && (
                      <Button variant="outline-secondary" onClick={handlePrevStep}>
                        Previous
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    
                    {bookingStep < 4 ? (
                      <Button 
                        variant="primary" 
                        onClick={handleNextStep}
                        disabled={(
                          (bookingStep === 1 && !formData.bookingKey) ||
                          (bookingStep === 2 && !formData.service) ||
                          (bookingStep === 3 && !formData.client)
                        )}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button 
                        variant="success" 
                        type="submit"
                        disabled={!formData.service || !formData.client || !formData.staff || !formData.startTime}
                      >
                        Create Booking
                      </Button>
                    )}
                  </div>
                </div>
              </Form>
            </>
          ) : (
            selectedBooking && (
              <div>
                <h5>{selectedBooking.title}</h5>
                <p>{selectedBooking.description}</p>
                
                <div className="mb-3">
                  <strong>Start Time:</strong> {new Date(selectedBooking.startTime).toLocaleString()}
                </div>
                
                <div className="mb-3">
                  <strong>End Time:</strong> {new Date(selectedBooking.endTime).toLocaleString()}
                </div>
                
                <div className="mb-3">
                  <strong>Status:</strong> {selectedBooking.status}
                </div>
                
                <div className="mb-3">
                  <strong>Location:</strong> {
                    selectedBooking.location ? (
                      typeof selectedBooking.location === 'object' ? 
                        [
                          selectedBooking.location.address, 
                          selectedBooking.location.city, 
                          selectedBooking.location.postcode
                        ].filter(Boolean).join(', ') || 'No address details' 
                      : selectedBooking.location
                    ) : 'No location specified'
                  }
                </div>
                
                {hasRole(['manager', 'superuser', 'admin']) && selectedBooking.status === 'scheduled' && (
                    <div className="d-flex justify-content-end">
                      <Button variant="danger" onClick={handleDeleteBooking} className="me-2">
                        Delete Booking
                      </Button>
                      <Button variant="warning" onClick={handleCancelBooking}>
                        Cancel Booking
                      </Button>
                    </div>
                  )}
              </div>
            )
          )}
        </Modal.Body>
      </Modal>

      {/* Calendar Settings Modal */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Calendar Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveSettings}>
            <Form.Group className="mb-3">
              <Form.Label>First Day of Week</Form.Label>
              <Form.Select name="firstDay" defaultValue={firstDay}>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="6">Saturday</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Business Hours Start</Form.Label>
              <Form.Control 
                type="time" 
                name="startTime" 
                defaultValue={businessHours.startTime} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Business Hours End</Form.Label>
              <Form.Control 
                type="time" 
                name="endTime" 
                defaultValue={businessHours.endTime} 
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Settings
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Booking Alert Accept/Reject Modal */}
      <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Booking Alert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAlert && (
            <div>
              <h5>{selectedAlert.title}</h5>
              <div className="mb-3">
                <strong>Client:</strong> {selectedAlert.client?.name || 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Service:</strong> {selectedAlert.service?.name || 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Date & Time:</strong> {selectedAlert.startTime ? new Date(selectedAlert.startTime).toLocaleDateString() : 'N/A'} at {selectedAlert.startTime ? new Date(selectedAlert.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'} - {selectedAlert.endTime ? new Date(selectedAlert.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Location:</strong> {selectedAlert.location?.address || 'N/A'}
              </div>
              {selectedAlert.description && (
                <div className="mb-3">
                  <strong>Description:</strong> {selectedAlert.description}
                </div>
              )}
              
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Would you like to accept this booking alert? If you accept, the manager will be notified to confirm the booking.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAlertModal(false)}>
            Close
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleAlertAction('reject')}
            className="me-2"
          >
            <i className="fas fa-times me-1"></i>
            Reject
          </Button>
          <Button 
            variant="success" 
            onClick={() => handleAlertAction('accept')}
          >
            <i className="fas fa-check me-1"></i>
            Accept
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Calendar;
