import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Card, Row, Col } from 'react-bootstrap';
import './CustomDayView.css';
import {
  parseTimeSlot,
  normalizeBookingDates,
  getBookingAtTimeSlot,
  getLeaveRequestAtTimeSlot,
  getEventAtTimeSlot,
  getBookingAlertAtTimeSlot,
  getBookingPosition,
  formatDisplayTime,
  getBookingDisplayData,
  getLeaveRequestDisplayData,
  getEventDisplayData,
  isStaffWorking,
  generateSlotClasses,
  generateBookingEventClasses
} from '../../utils/bookingUtils';

const CustomDayView = ({
  currentDate,
  selectedEmployees,
  bookings,
  leaveRequests = [],
  bookingAlerts = [],
  businessHours,
  onTimeSlotClick,
  onEventClick,
  onDateChange
}) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const scrollContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const dayViewRef = useRef(null);

  // Optimized color forcing with debounce to prevent flickering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dayViewRef.current) {
        const bookingElements = dayViewRef.current.querySelectorAll('.booking-event');
        bookingElements.forEach((element) => {
          const bookingData = element.getAttribute('data-booking-color');
          if (bookingData && element.style.backgroundColor !== bookingData) {
            // IE-compatible direct style assignment
            element.style.backgroundColor = bookingData;
            element.style.background = bookingData;
            element.style.color = 'white';
          }
        });
      }
    }, 50); // Small delay to prevent flickering
    
    return () => clearTimeout(timeoutId);
  }, [bookings.length]); // Only re-run when number of bookings changes

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    // Generate time slots based on business hours
    const slots = generateTimeSlots(businessHours.startTime, businessHours.endTime);
    setTimeSlots(slots);
  }, [businessHours]);

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      // Format time in 12-hour format with AM/PM
      const hour12 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
      const ampm = currentHour >= 12 ? 'PM' : 'AM';
      const timeString = `${hour12}:${currentMin.toString().padStart(2, '0')} ${ampm}`;
      slots.push(timeString);
      
      currentMin += 30; // 30-minute intervals
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Simplified booking retrieval using utility functions
  const getBookingAtTime = (staffId, timeSlot) => {
    const booking = getBookingAtTimeSlot(bookings, staffId, currentDate, timeSlot);
    if (booking) {
      console.log('📅 CustomDayView: Found booking for', staffId, 'at', timeSlot, ':', booking.title);
    }
    return booking;
  };

  // Debug effect to log booking data changes
  useEffect(() => {
    console.log('📅 CustomDayView: Bookings data updated:', {
      totalBookings: bookings.length,
      currentDate: currentDate.toDateString(),
      selectedEmployees: selectedEmployees.map(emp => emp.name),
      sampleBooking: bookings[0] ? {
        title: bookings[0].title,
        staff: bookings[0].extendedProps?.staff,
        start: bookings[0].start
      } : 'No bookings'
    });
  }, [bookings, currentDate, selectedEmployees]);

  // Check if a time slot is within staff working hours
  const isWithinWorkingHours = (staff, timeSlot) => {
    return isStaffWorking(staff, currentDate, timeSlot);
  };

  const handleTimeSlotClick = (staffId, timeSlot) => {
    if (onTimeSlotClick) {
      const clickedDateTime = new Date(currentDate);
      // Parse 12-hour format time slot
      const [timePart, ampm] = timeSlot.split(' ');
      const [hours12, minutes] = timePart.split(':').map(Number);
      // Convert to 24-hour format
      let hours24 = hours12;
      if (ampm === 'AM' && hours12 === 12) {
        hours24 = 0;
      } else if (ampm === 'PM' && hours12 !== 12) {
        hours24 = hours12 + 12;
      }
      clickedDateTime.setHours(hours24, minutes, 0, 0);
      onTimeSlotClick({
        date: clickedDateTime,
        staffId: staffId,
        timeSlot: timeSlot
      });
    }
  };

  const startAutoScroll = (direction, speed = 2) => {
    if (scrollIntervalRef.current) return;
    
    scrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollAmount = direction === 'left' ? -speed : speed;
        container.scrollLeft += scrollAmount;
        
        // Stop scrolling if we've reached the end
        if (direction === 'left' && container.scrollLeft <= 0) {
          stopAutoScroll();
        } else if (direction === 'right' && 
                   container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          stopAutoScroll();
        }
      }
    }, 16); // ~60fps
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleMouseMove = (e) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scrollZone = 100; // pixels from edge to trigger scroll
    
    // Stop any existing scroll
    stopAutoScroll();
    
    // Check if mouse is in left scroll zone
    if (mouseX < scrollZone && container.scrollLeft > 0) {
      const speed = Math.max(1, (scrollZone - mouseX) / 20);
      startAutoScroll('left', speed);
    }
    // Check if mouse is in right scroll zone
    else if (mouseX > rect.width - scrollZone && 
             container.scrollLeft < container.scrollWidth - container.clientWidth) {
      const speed = Math.max(1, (mouseX - (rect.width - scrollZone)) / 20);
      startAutoScroll('right', speed);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, []);

  const getStaffCountClass = () => {
    const count = selectedEmployees.length;
    if (count <= 2) return 'few-staff';
    if (count >= 3 && count <= 5) return 'medium-staff';
    if (count >= 6) return 'many-staff';
    return '';
  };

  return (
    <div 
      ref={dayViewRef}
      className={`custom-day-view ${getStaffCountClass()}`}
      style={{'--staff-count': selectedEmployees.length}}
    >
      <div className="day-navigation">
        <button className="nav-arrow" onClick={() => navigateDay(-1)}>‹</button>
        <h2 className="day-title">{formatDate(currentDate)}</h2>
        <button className="nav-arrow" onClick={() => navigateDay(1)}>›</button>
      </div>
      <div 
        className="day-content-container"
        ref={scrollContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopAutoScroll}
      >
        <div className="staff-headers-row">
          <div className="time-column-header">Time</div>
          <div className="staff-headers">
            {selectedEmployees.map((staff, staffIndex) => (
              <div key={staffIndex} className="staff-header">
                {staff.photo ? (
                        <img 
                          src={staff.photo} 
                          alt={staff.name}
                          className="staff-photo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="staff-photo-placeholder" style={{display: staff.photo ? 'none' : 'flex'}}>
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                <span className="staff-name">{staff.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="day-content">
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="time-row">
              <div className="time-label">{timeSlot}</div>
              <div className="staff-columns">
                {selectedEmployees.map((staff, staffIndex) => {
                  const event = getEventAtTimeSlot(bookings, leaveRequests, bookingAlerts, staff.id, currentDate, timeSlot);
                  const isBooking = event && !event.extendedProps?.type;
                  const isLeaveRequest = event && event.extendedProps?.type === 'leave-request';
                  const isBookingAlert = event && event.extendedProps?.type === 'booking-alert';
                  const isWorking = isStaffWorking(staff, timeSlot, businessHours);
                  
                  // For bookings, calculate position; for leave requests and booking alerts, only show at first time slot
                  const eventPosition = isBooking ? 
                    getBookingPosition(bookings, staff.id, currentDate, timeSlots, timeIndex, event) :
                    (isLeaveRequest || isBookingAlert ? (timeIndex === 0 ? 'booking-start' : '') : '');
                  
                  const eventDisplayData = getEventDisplayData(event);
                  const slotClasses = generateSlotClasses({
                    hasBooking: !!event,
                    bookingPosition: eventPosition,
                    isWorking
                  });
                  
                  return (
                    <div 
                      key={staffIndex} 
                      className={slotClasses}
                      onClick={() => handleTimeSlotClick(staff.id, timeSlot)}
                    >
                      {event && (eventPosition === 'booking-start' || (eventPosition === '' && !isLeaveRequest)) && (() => {
                        if (isLeaveRequest) {
                          // Leave requests span the entire day
                          const totalHeight = timeSlots.length * 60; // All time slots
                          
                          return (
                            <div 
                              className={`booking-event booking-continuous`}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: `${totalHeight}px`,
                                backgroundColor: eventDisplayData?.backgroundColor || '#FFF3CD',
                                color: eventDisplayData?.textColor || '#856404',
                                border: '2px solid rgba(0, 0, 0, 0.8)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                zIndex: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEventClick) onEventClick({ event });
                              }}
                            >
                              {eventDisplayData && (
                                <>
                                  <div className="booking-title" style={{ 
                                    fontWeight: '600',
                                    marginBottom: '2px',
                                    fontSize: '11px',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {eventDisplayData.title}
                                  </div>
                                  <div className="booking-client" style={{ 
                                    fontSize: '10px',
                                    opacity: '0.9',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginBottom: '2px'
                                  }}>
                                    {eventDisplayData.client}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        } else {
                          // Regular booking logic
                          const bookingSlots = timeSlots.filter((slot, idx) => {
                             const slotBooking = getBookingAtTimeSlot(bookings, staff.id, currentDate, slot);
                             return slotBooking && slotBooking.id === event.id;
                           }).length;
                          
                          // Limit height to remaining slots to prevent running off calendar
                          const remainingSlots = timeSlots.length - timeIndex;
                          const slotHeight = 60;
                          const maxHeight = remainingSlots * slotHeight;
                          const totalHeight = Math.min(bookingSlots * slotHeight, maxHeight);
                          
                          return (
                            <div 
                              className={`booking-event booking-continuous`}
                              data-booking-color={eventDisplayData?.backgroundColor || event.backgroundColor || '#FF4444'}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: `${totalHeight}px`,
                                backgroundColor: eventDisplayData?.backgroundColor || event.backgroundColor || '#FF4444',
                                color: 'white',
                                fontWeight: 'bold',
                                border: '2px solid rgba(0, 0, 0, 0.8)',
                                borderRadius: '4px',
                                padding: '4px',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEventClick) onEventClick({ event });
                              }}
                            >
                              {eventDisplayData && (
                                <>
                                  <div className="booking-title">{eventDisplayData.title}</div>
                                  <div className="booking-client">{eventDisplayData.clientName}</div>
                                  <div className="booking-time">{eventDisplayData.timeDisplay}</div>
                                  <div className="booking-service">{eventDisplayData.serviceName}</div>
                                  <div className="service-color-indicator">
                                    <div 
                                      className="service-color-circle"
                                      style={{
                                        backgroundColor: eventDisplayData.backgroundColor,
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        margin: '4px auto',
                                        border: '1px solid rgba(255,255,255,0.8)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                      }}
                                    ></div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        }
                      })()}
                      {event && eventPosition === 'booking-middle' && !isLeaveRequest && (
                        <div 
                          className="booking-event booking-middle"
                          style={{ 
                            height: '100%', 
                            minHeight: '60px', 
                            backgroundColor: eventDisplayData?.backgroundColor || event.backgroundColor || '#FF4444',
                            border: '2px solid rgba(0, 0, 0, 0.8)',
                            borderTop: 'none',
                            borderBottom: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 10
                          }} 
                        />
                      )}
                      {event && eventPosition === 'booking-end' && !isLeaveRequest && (
                        <div 
                          className="booking-event booking-end"
                          style={{ 
                            height: '100%', 
                            minHeight: '60px', 
                            backgroundColor: eventDisplayData?.backgroundColor || event.backgroundColor || '#FF4444',
                            border: '2px solid rgba(0, 0, 0, 0.8)',
                            borderTop: 'none',
                            borderRadius: '0 0 6px 6px',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 10
                          }} 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomDayView;