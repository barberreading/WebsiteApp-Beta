/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Handles API request errors and returns appropriate error messages
 * @param {Error} error - The error object from the catch block
 * @param {string} defaultMessage - Default message to show if error details aren't available
 * @returns {string} Formatted error message
 */
export const handleApiError = (error, defaultMessage = 'An error occurred. Please try again.') => {
  console.error(defaultMessage, error);
  
  // Handle authentication errors
  if (error.response && error.response.status === 401) {
    return 'Authentication error. Please log in again.';
  }
  
  // Handle server errors
  if (error.response && error.response.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  // Handle validation errors
  if (error.response && error.response.status === 400) {
    return error.response.data?.msg || 'Invalid request. Please check your inputs.';
  }
  
  // Handle not found errors
  if (error.response && error.response.status === 404) {
    return 'Resource not found.';
  }
  
  // Handle network errors
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }
  
  // Handle token errors
  if (error.message === 'Authentication token not found') {
    return 'Authentication error. Please log in again.';
  }
  
  // Return custom message from server if available
  if (error.response && error.response.data && error.response.data.msg) {
    return error.response.data.msg;
  }
  
  // Return default message if no specific error handling applies
  return defaultMessage;
};

/**
 * Checks if the current token is valid
 * @returns {boolean} True if token exists
 */
export const validateToken = () => {
  const token = localStorage.getItem('token');
  return !!token;
};