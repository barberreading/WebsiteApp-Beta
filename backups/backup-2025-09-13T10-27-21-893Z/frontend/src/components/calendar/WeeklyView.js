import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form } from 'react-bootstrap';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWeekend, isWithinInterval, isSameDay } from 'date-fns';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useHasRole } from '../../utils/roleUtils';

// UK Bank Holidays for 2024
const UK_BANK_HOLIDAYS_2024 = [
  new Date(2024, 0, 1),  // New Year's Day
  new Date(2024, 2, 29), // Good Friday
  new Date(2024, 3, 1),  // Easter Monday
  new Date(2024, 4, 6),  // Early May Bank Holiday
  new Date(2024, 4, 27), // Spring Bank Holiday
  new Date(2024, 7, 26), // Summer Bank Holiday
  new Date(2024, 11, 25), // Christmas Day
  new Date(2024, 11, 26), // Boxing Day
];

// Check if a date is a UK bank holiday
const isUKBankHoliday = (date) => {
  return UK_BANK_HOLIDAYS_2024.some(holiday => 
    date.getDate() === holiday.getDate() && 
    date.getMonth() === holiday.getMonth() && 
    date.getFullYear() === holiday.getFullYear()
  );
};

const WeeklyView = ({ bookings, services, staff, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showLimits, setShowLimits] = useState(true);
  const hasManagerRole = useHasRole(['manager', 'superuser', 'admin']);

  // Initialize week days when selected date changes
  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday
    const days = eachDayOfInterval({ start, end });
    setWeekDays(days);
  }, [selectedDate]);

  // Filter bookings when filters change
  useEffect(() => {
    if (!bookings || !Array.isArray(bookings)) {
      setFilteredBookings([]);
      return;
    }
    
    let filtered = [...bookings].filter(booking => 
      booking && booking.startTime && booking.status !== 'cancelled'
    );
    
    if (selectedService !== 'all') {
      filtered = filtered.filter(booking => booking.service && booking.service._id === selectedService);
    }
    
    if (selectedStaff !== 'all') {
      filtered = filtered.filter(booking => booking.staff && booking.staff._id === selectedStaff);
    }
    
    setFilteredBookings(filtered);
    console.log('Filtered bookings:', filtered.length);
  }, [bookings, selectedService, selectedStaff]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setSelectedDate(prevDate => addDays(prevDate, -7));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setSelectedDate(prevDate => addDays(prevDate, 7));
  };

  // Get service availability for a specific day
  const getServiceAvailability = (serviceId, date) => {
    if (!showLimits) return null;
    
    const service = services.find(s => s._id === serviceId);
    if (!service || !service.dailyBookingLimit) return null;
    
    // Count bookings for this service on this day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const count = bookings.filter(booking => 
      booking.service === serviceId && 
      new Date(booking.startTime) >= startOfDay && 
      new Date(booking.startTime) <= endOfDay &&
      booking.status !== 'cancelled'
    ).length;
    
    return {
      count,
      limit: service.dailyBookingLimit,
      available: service.dailyBookingLimit - count,
      percentage: Math.round((count / service.dailyBookingLimit) * 100)
    };
  };

  // Render availability indicator
  const renderAvailabilityIndicator = (serviceId, date) => {
    const availability = getServiceAvailability(serviceId, date);
    if (!availability) return null;
    
    let variant = 'success';
    if (availability.percentage >= 100) variant = 'danger';
    else if (availability.percentage >= 75) variant = 'warning';
    
    return (
      <Badge 
        bg={variant} 
        className="ms-1"
        style={{ fontSize: '0.7rem' }}
        title={`${availability.count}/${availability.limit} bookings`}
      >
        {availability.available > 0 ? `${availability.available}` : 'Full'}
      </Badge>
    );
  };

  // Get bookings for a specific day and time slot
  const getBookingsForTimeSlot = (day, hour) => {
    const startTime = new Date(day);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(day);
    endTime.setHours(hour, 59, 59, 999);
    
    return filteredBookings.filter(booking => {
      if (!booking.startTime) return false;
      
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime || bookingStart);
      
      // Check if booking overlaps with this time slot
      return (
        (bookingStart >= startTime && bookingStart <= endTime) || // Booking starts in this slot
        (bookingEnd >= startTime && bookingEnd <= endTime) || // Booking ends in this slot
        (bookingStart <= startTime && bookingEnd >= endTime) // Booking spans over this slot
      );
    });
  };

  // Render time slots for the weekly view
  const renderTimeSlots = () => {
    const businessHours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    
    return businessHours.map(hour => (
      <Row key={hour} className="time-slot-row">
        <Col xs={1} className="time-label">
          {hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
        </Col>
        {weekDays.map(day => {
          const bookingsInSlot = getBookingsForTimeSlot(day, hour);
          const isNonWorking = isNonWorkingDay(day);
          return (
            <Col 
              key={day.toISOString()} 
              className={`time-slot ${isNonWorking ? 'weekend-time-slot' : ''}`}
              style={{
                backgroundColor: isNonWorking ? '#f8f9fa' : 'white',
                cursor: 'pointer'
              }}
              onClick={() => {
                const selectedDateTime = new Date(day);
                selectedDateTime.setHours(hour, 0, 0, 0);
                onDateSelect(selectedDateTime);
              }}
            >
              {bookingsInSlot.map(booking => {
                // Handle both populated and unpopulated service/staff objects
                const serviceId = booking.service?._id || booking.service;
                const staffId = booking.staff?._id || booking.staff;
                const clientName = booking.client?.name || (booking.clientName || 'No client');
                
                const service = services.find(s => s._id === serviceId);
                const staffMember = staff.find(s => s._id === staffId);
                
                return (
                  <div 
                    key={booking._id} 
                    className="booking-item"
                    style={{ 
                      backgroundColor: service?.color || 'transparent',
                      color: '#fff',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      marginBottom: '3px',
                      fontSize: '0.85rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      opacity: booking.status === 'cancelled' ? 0.6 : 1
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasManagerRole) {
                        window.location.href = `/booking-edit/${booking._id}`;
                      }
                      // Staff users can still click but won't navigate to edit
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      <i className="fas fa-clock" style={{ marginRight: '5px' }}></i>
                      {booking.startTime ? format(new Date(booking.startTime), 'h:mm a') : ''} - <span style={{ fontWeight: 'bold' }}>{service?.name || booking.serviceName || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-user" style={{ marginRight: '5px' }}></i>
                        {clientName}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                        <i className="fas fa-user-tie" style={{ marginRight: '3px' }}></i>
                        {staffMember?.name || booking.staffName || 'Unknown'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </Col>
          );
        })}
      </Row>
    ));
  };

  // Function to determine if a day is a weekend or bank holiday
  const isNonWorkingDay = (date) => {
    return isWeekend(date) || isUKBankHoliday(date);
  };

  // Add CSS styles for the calendar
  const calendarStyles = `
    .weekend-column {
      background-color: #f8f9fa;
      width: 10%;
    }
    
    .weekend-time-slot {
      background-color: #f8f9fa !important;
    }
    
    .bank-holiday-badge {
      font-size: 0.6rem;
      margin-top: 2px;
    }
    
    .time-slot {
      min-height: 60px;
      border: 1px solid #e9ecef;
    }
    
    .time-slot:hover {
      background-color: #f1f3f5;
    }
  `;

  return (
    <Container fluid className="weekly-view">
      <style>{calendarStyles}</style>
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="outline-secondary" onClick={goToPreviousWeek}>
              &lt; Previous Week
            </Button>
            <h4>{format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}</h4>
            <Button variant="outline-secondary" onClick={goToNextWeek}>
              Next Week &gt;
            </Button>
          </div>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col md={4}>
          <Form.Select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="all">All Services</option>
            {services.map(service => (
              <option key={service._id} value={service._id}>
                {service.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select 
            value={selectedStaff} 
            onChange={(e) => setSelectedStaff(e.target.value)}
          >
            <option value="all">All Staff</option>
            {staff.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Check 
            type="switch"
            id="show-limits-switch"
            label="Show Daily Limits"
            checked={showLimits}
            onChange={(e) => setShowLimits(e.target.checked)}
          />
        </Col>
      </Row>
      
      <Card>
        <Card.Body>
          <Row className="day-header">
            <Col xs={1}></Col>
            {weekDays.map(day => {
              const isNonWorking = isNonWorkingDay(day);
              return (
                <Col 
                  key={day.toISOString()} 
                  className={`text-center ${isNonWorking ? 'weekend-column' : ''}`}
                >
                  <div 
                    className={`day-name ${isNonWorking ? 'text-muted' : ''}`}
                    style={{ fontWeight: isNonWorking ? 'normal' : 'bold' }}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div 
                    className={`day-date ${isNonWorking ? 'text-muted' : ''}`}
                    style={{ fontSize: isNonWorking ? '0.9rem' : '1rem' }}
                  >
                    {format(day, 'd')}
                  </div>
                  {selectedService !== 'all' && renderAvailabilityIndicator(selectedService, day)}
                  {isUKBankHoliday(day) && (
                    <Badge bg="secondary" className="bank-holiday-badge">Bank Holiday</Badge>
                  )}
                </Col>
              );
            })}
          </Row>
          
          <div className="time-slots-container">
            {renderTimeSlots()}
          </div>
        </Card.Body>
      </Card>
      
      <style jsx="true">{`
        .weekly-view .time-slot-row {
          min-height: 60px;
          border-bottom: 1px solid #eee;
        }
        .weekly-view .time-label {
          font-weight: bold;
          text-align: right;
          padding-right: 10px;
        }
        .weekly-view .time-slot {
          border-left: 1px solid #eee;
          min-height: 60px;
          padding: 2px;
        }
        .weekly-view .day-header {
          border-bottom: 2px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .weekly-view .day-name {
          font-weight: bold;
        }
        .weekly-view .day-date {
          font-size: 1.2rem;
        }
        .weekly-view .time-slots-container {
          max-height: 600px;
          overflow-y: auto;
        }
      `}</style>
    </Container>
  );
};

export default WeeklyView;