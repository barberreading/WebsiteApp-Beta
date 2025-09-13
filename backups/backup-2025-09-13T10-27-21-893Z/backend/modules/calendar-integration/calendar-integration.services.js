/**
 * Utility functions for calendar integration
 * Provides methods to generate calendar links for different platforms
 */

/**
 * Generate an Outlook calendar link for a booking
 * @param {Object} booking - The booking object with details
 * @returns {String} - URL that can be used to add event to Outlook calendar
 */
const generateOutlookCalendarLink = (booking) => {
  // Format dates for Outlook calendar
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  
  // Format dates in the required format: YYYY-MM-DDTHH:MM:SS
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  // Create a descriptive subject line
  const subject = `${booking.service.name} - ${booking.client.name}`;
  
  // Create a detailed description with booking information
  let description = `Booking Details:\\n`;
  description += `Service: ${booking.service.name}\\n`;
  description += `Client: ${booking.client.name}\\n`;
  description += `Location: ${booking.location || 'Not specified'}\\n`;
  description += `Staff: ${booking.assignedStaff ? booking.assignedStaff.name : 'Not assigned'}\\n`;
  description += `Notes: ${booking.notes || 'None'}\\n`;
  
  // Build the Outlook calendar URL
  const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(description)}&startdt=${start}&enddt=${end}&location=${encodeURIComponent(booking.location || '')}`;
  
  return outlookUrl;
};

/**
 * Generate a generic iCalendar file content
 * @param {Object} booking - The booking object with details
 * @returns {String} - iCalendar format content
 */
const generateICalContent = (booking) => {
  // Format dates for iCal
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  
  // Format dates in the required format: YYYYMMDDTHHMMSSZ
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const now = formatDate(new Date());
  
  // Create a unique identifier
  const uid = `booking-${booking._id}@everythingchildcareagency.com`;
  
  // Create a descriptive subject line
  const summary = `${booking.service.name} - ${booking.client.name}`;
  
  // Create a detailed description with booking information
  let description = `Booking Details:\n`;
  description += `Service: ${booking.service.name}\n`;
  description += `Client: ${booking.client.name}\n`;
  description += `Location: ${booking.location || 'Not specified'}\n`;
  description += `Staff: ${booking.assignedStaff ? booking.assignedStaff.name : 'Not assigned'}\n`;
  description += `Notes: ${booking.notes || 'None'}\n`;
  
  // Build the iCal content
  const iCalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Everything Childcare Agency//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${booking.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return iCalContent;
};

module.exports = {
  generateOutlookCalendarLink,
  generateICalContent
};