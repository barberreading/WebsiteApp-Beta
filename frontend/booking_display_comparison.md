# Booking Display Logic Comparison

## Normal Bookings vs Booking Alerts vs Leave Requests

### 1. Normal Bookings Flow:
```javascript
// fetchBookings() function:
- API call: `/api/bookings/range?startDate=${startDate}&endDate=${endDate}`
- Role-based filtering in API URL (staff: staffId, client: clientId)
- Transform to calendar events with service colors
- Store in: setBookings(calendarEvents)
- Event structure:
  {
    id: booking._id,
    title: `${clientName} - ${serviceTitle}${locationText}`,
    start: startTime,
    end: endTime,
    backgroundColor: serviceColor,
    borderColor: getStatusColor(booking.status),
    extendedProps: { staff, client, service, etc. },
    classNames: ['booking-event']
  }
```

### 2. Booking Alerts Flow:
```javascript
// fetchBookingAlerts() function:
- Role check: ONLY for currentUser.role === 'staff'
- API call: `/api/booking-alerts/available`
- No date filtering (backend handles this)
- Transform to calendar events with red color
- Store in: setBookingAlerts(calendarAlerts)
- Event structure:
  {
    id: `alert-${alert._id}`,
    title: `🚨 ${alert.title}`,
    start: new Date(alert.startTime),
    end: new Date(alert.endTime),
    backgroundColor: '#dc3545', // Red
    borderColor: '#dc3545',
    extendedProps: { type: 'booking-alert', alertId, etc. },
    classNames: ['booking-alert-event', 'flashing-border']
  }
```

### 3. Leave Requests Flow:
```javascript
// fetchLeaveRequests() function:
- API call: `/api/leave-requests/range?startDate=${startYear}&endDate=${endNextYear}`
- Wide date range (current year to next year)
- Transform to calendar events with status-based colors
- Return array (not stored directly in state)
- Event structure:
  {
    id: `leave-${leave._id}`,
    title: `${staffName} - ${leave.reason}`,
    start: new Date(leave.startDate),
    end: adjustedEndDate, // +1 day for all-day display
    allDay: true,
    backgroundColor: statusColor,
    extendedProps: { type: 'leave-request', staff, etc. },
    classNames: ['leave-request-event']
  }
```

### 4. Event Combination in filterBookings():
```javascript
// Staff users:
filtered = [...filtered, ...bookingAlerts]; // Add alerts
filtered = [...filtered, ...staffLeaveRequests]; // Add filtered leave requests

// Managers/Admins:
filtered = [...bookings, ...bookingAlerts, ...leaveRequests]; // All events
```

### 5. Final Display:
```javascript
// FullCalendar component:
events={filteredBookings} // Combined array of all event types
```

## Key Differences Identified:

1. **Role Checking**: 
   - Bookings: Role-based API filtering
   - Alerts: Frontend role check (staff only)
   - Leave Requests: No role check in fetch, filtered in filterBookings()

2. **Date Filtering**:
   - Bookings: Dynamic date range based on calendar view
   - Alerts: No date filtering (backend handles)
   - Leave Requests: Fixed wide date range (year to year)

3. **State Management**:
   - Bookings: Stored in `bookings` state
   - Alerts: Stored in `bookingAlerts` state
   - Leave Requests: Stored in `leaveRequests` state via useEffect promise

4. **Event Structure**:
   - All follow similar structure but with different styling and properties
   - Alerts have special flashing-border class
   - Leave requests are all-day events

## Potential Issues:

1. **Authentication**: Role detection might be failing
2. **API Responses**: Backend might not be returning expected data
3. **State Updates**: Events might not be triggering re-renders
4. **Filtering Logic**: ObjectID comparison issues in filterBookings()