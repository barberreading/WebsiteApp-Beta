/**
 * Authentication utility functions
 */

/**
 * Check if user is authenticated by verifying token exists
 * @returns {boolean} - True if user has a valid token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Get the authentication token from localStorage
 * @returns {string|null} - The auth token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The auth token to store
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

/**
 * Get authorization headers for API requests
 * @returns {object} - Headers object with authorization token
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'x-auth-token': token } : {};
};

/**
 * Check if the current session is valid (basic check)
 * @returns {boolean} - True if session appears valid
 */
export const isSessionValid = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Basic token format validation (JWT has 3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
  } catch (error) {
    return false;
  }
};

// Alias for isSessionValid for backward compatibility
export const validateToken = isSessionValid;