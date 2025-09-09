import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addMinutes } from 'date-fns';
import { Card, Row, Col, Button } from 'react-bootstrap';
import './CustomWeeklyView.css';
import {
  parseTimeSlot,
  normalizeBookingDates,
  getBookingAtTimeSlot,
  getLeaveRequestAtTimeSlot,
  getEventAtTimeSlot,
  getBookingPosition,
  formatDisplayTime,
  getBookingDisplayData,
  getLeaveRequestDisplayData,
  getEventDisplayData,
  isStaffWorking,
  generateSlotClasses,
  generateBookingEventClasses
} from '../../utils/bookingUtils';

const CustomWeeklyView = ({ currentDate, selectedEmployees, bookings, leaveRequests = [], businessHours, onTimeSlotClick, onEventClick, onDateChange }) => {
  const [weekStart, setWeekStart] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const weeklyViewRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    setWeekStart(start);
    
    // Generate time slots based on business hours
    const slots = generateTimeSlots(businessHours.startTime, businessHours.endTime);
    setTimeSlots(slots);
  }, [currentDate, businessHours]);

  // Apply booking colors using useEffect
  useEffect(() => {
    if (weeklyViewRef.current && bookings.length > 0) {
      const bookingElements = weeklyViewRef.current.querySelectorAll('.booking-event');
      bookingElements.forEach(element => {
        const bookingId = element.getAttribute('data-booking-id');
        const booking = bookings.find(b => b.id === bookingId);
        if (booking && booking.extendedProps && booking.extendedProps.service && booking.extendedProps.service.color) {
          const color = booking.extendedProps.service.color;
          element.style.backgroundColor = color;
          element.style.background = color;
          element.style.color = 'white';
        }
      });
    }
  }, [bookings, weekStart]);

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

  const getDayBookings = (date, staffId) => {
    return bookings.filter(booking => {
      const bookingDate = normalizeBookingDates(booking.start);
      const dateMatch = isSameDay(bookingDate, date);
      // Use same logic as day view
      const staffMatch = booking.extendedProps?.staff === staffId;
      return dateMatch && staffMatch;
    });
  };

  const getBookingAtTime = (date, staffId, timeSlot) => {
    return getBookingAtTimeSlot(bookings, staffId, date, timeSlot);
  };

  const getBookingDuration = (booking) => {
    const start = booking.start instanceof Date ? booking.start : parseISO(booking.start);
    const end = booking.end instanceof Date ? booking.end : parseISO(booking.end);
    return Math.ceil((end - start) / (30 * 60 * 1000)); // Duration in 30-minute slots
  };

  const isBookingStart = (booking, timeSlot) => {
    const startDate = booking.start instanceof Date ? booking.start : parseISO(booking.start);
    // Convert booking start time to 12-hour format to match timeSlot format
    const bookingStart = format(startDate, 'h:mm a');
    return bookingStart === timeSlot;
  };

  // Check if a time slot is within staff working hours
  const isWithinWorkingHours = (staff, day, timeSlot) => {
    return isStaffWorking(staff.id, timeSlot, businessHours);
  };

  const handleTimeSlotClick = (date, staffId, timeSlot) => {
    if (onTimeSlotClick) {
      const clickedDateTime = new Date(date);
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

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = addDays(currentDate, -7);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const goToNextWeek = () => {
    const newDate = addDays(currentDate, 7);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  if (!weekStart) return <div>Loading...</div>;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div 
      className="custom-weekly-view"
      ref={weeklyViewRef}
      style={{'--staff-count': selectedEmployees.length}}
    >

      {/* Navigation Header */}
      <div className="week-navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px' }}>
        <Button variant="outline-secondary" onClick={goToPreviousWeek}>
          &lt; Previous Week
        </Button>
        <h4 style={{ margin: 0 }}>
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </h4>
        <Button variant="outline-secondary" onClick={goToNextWeek}>
          Next Week &gt;
        </Button>
      </div>
      
      <div 
        className="week-content-container"
        ref={scrollContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopAutoScroll}
      >
        <div className="date-headers-row">
          <div className="time-column-header">Time</div>
          <div className="days-date-headers">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="day-date-header">
                <div className="day-info">
                  <div className="day-name">{format(day, 'EEEE')}</div>
                  <div className="day-date">{format(day, 'dd/MM')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="staff-headers-row">
          <div className="time-column-header"></div>
          <div className="days-staff-headers">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="day-staff-headers">
                {selectedEmployees.map((staff, staffIndex) => (
                  <div key={staffIndex} className="staff-header-column">
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
            ))}
          </div>
        </div>
        <div className="week-content">
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="time-row">
              <div className="time-label">{timeSlot}</div>
              <div className="days-time-grid">
                {weekDays.map((day, dayIndex) => (
                  <div key={dayIndex} className="day-column">
                    <div className="day-staff-columns">
                      {selectedEmployees.map((staff, staffIndex) => {
                        const event = getEventAtTimeSlot(bookings, leaveRequests, staff.id, day, timeSlot);
                        const isBooking = event && !event.extendedProps?.type;
                        const isLeaveRequest = event && event.extendedProps?.type === 'leave-request';
                        const isWorking = isStaffWorking(staff, timeSlot, businessHours);
                        
                        // For bookings, calculate position; for leave requests, always show as start
                        const eventPosition = isBooking ? 
                          getBookingPosition(bookings, staff.id, day, timeSlots, timeIndex, event) :
                          (isLeaveRequest ? 'booking-start' : '');
                        
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
                            onClick={() => {
                              // If there's an event in this slot, open the event instead of creating new one
                              if (event) {
                                if (onEventClick) onEventClick({ event });
                              } else {
                                handleTimeSlotClick(day, staff.id, timeSlot);
                              }
                            }}
                            style={{
                              position: 'relative',
                              zIndex: event ? 2 : 1
                            }}
                          >
                            {event && eventPosition === 'booking-start' && (() => {
                              if (isLeaveRequest) {
                                // Leave requests span the entire day
                                const totalHeight = timeSlots.length * 60; // All time slots
                                
                                return (
                                  <div 
                                    className={`leave-request-event`}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: `${totalHeight}px`,
                                      backgroundColor: eventDisplayData?.backgroundColor || '#FFF3CD',
                                      color: eventDisplayData?.textColor || '#856404',
                                      fontWeight: 'bold',
                                      border: '2px solid rgba(0, 0, 0, 0.2)',
                                      borderRadius: '4px',
                                      padding: '8px 4px',
                                      zIndex: 5,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      textAlign: 'center',
                                      opacity: 0.9
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onEventClick) onEventClick({ event });
                                    }}
                                  >
                                    {eventDisplayData && (
                                      <>
                                        <div className="leave-title" style={{ fontSize: '12px', marginBottom: '2px' }}>
                                          {eventDisplayData.title}
                                        </div>
                                        <div className="leave-reason" style={{ fontSize: '10px', fontStyle: 'italic' }}>
                                          {eventDisplayData.reason}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              } else {
                                // Regular booking logic
                                const bookingSlots = timeSlots.filter((slot, idx) => {
                                  const slotBooking = getBookingAtTimeSlot(bookings, staff.id, day, slot);
                                  return slotBooking && slotBooking.id === event.id;
                                }).length;
                                
                                const slotHeight = 60;
                                const totalHeight = bookingSlots * slotHeight;
                                
                                return (
                                  <div 
                                    className={`booking-event booking-continuous`}
                                    data-booking-color={eventDisplayData?.backgroundColor}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: `${totalHeight}px`,
                                      backgroundColor: eventDisplayData?.backgroundColor,
                                      color: eventDisplayData?.textColor,
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
                                    <div className="booking-title">{eventDisplayData?.title}</div>
                                    <div className="booking-client">{eventDisplayData?.clientName}</div>
                                    <div className="booking-time">{eventDisplayData?.timeDisplay}</div>
                                    <div className="booking-service">{eventDisplayData?.serviceName}</div>
                                    <div className="service-color-indicator">
                                      <div
                                        className="service-color-circle"
                                        style={{
                                          backgroundColor: eventDisplayData?.backgroundColor,
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          margin: '4px auto',
                                          border: '1px solid rgba(255,255,255,0.8)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                            {event && eventPosition !== 'booking-start' && eventPosition !== '' && !isLeaveRequest && (
                              <div style={{ height: '100%', minHeight: '60px' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomWeeklyView;