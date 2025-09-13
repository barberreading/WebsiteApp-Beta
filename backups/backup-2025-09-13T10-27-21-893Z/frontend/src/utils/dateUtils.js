/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Format a date to DD/MM/YYYY format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if dateObj is a valid Date object and has getTime method
    if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return '';
  }
};

/**
 * Format a date and time to DD/MM/YYYY HH:MM format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if dateObj is a valid Date object and has getTime method
    if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date time:', error, 'Date value:', date);
    return '';
  }
};