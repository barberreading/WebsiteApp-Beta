import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to check if the current user has any of the specified roles
 * @param {string[]} roles - Array of roles to check against
 * @returns {boolean} - True if user has any of the specified roles
 */
export const useHasRole = (roles) => {
  const { currentUser } = useAuth();
  
  if (!currentUser || !currentUser.role) {
    return false;
  }
  
  return roles.includes(currentUser.role);
};

/**
 * Function to check if a user object has any of the specified roles
 * @param {object} user - User object with role property
 * @param {string[]} roles - Array of roles to check against
 * @returns {boolean} - True if user has any of the specified roles
 */
export const hasRole = (roles, user = null) => {
  // If user is provided, use it; otherwise try to get from localStorage
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!currentUser || !currentUser.role) {
    return false;
  }
  
  return roles.includes(currentUser.role);
};

/**
 * Function to check if a user object has a specific role
 * @param {string} role - Role to check
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user has the specified role
 */
export const hasSpecificRole = (role, user = null) => {
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!currentUser || !currentUser.role) {
    return false;
  }
  
  return currentUser.role === role;
};

/**
 * Get the current user's role from localStorage
 * @returns {string|null} - Current user's role or null if not authenticated
 */
export const getCurrentUserRole = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  return currentUser?.role || null;
};

/**
 * Check if user is a manager or superuser (admin roles)
 * @param {object} user - User object
 * @returns {boolean} - True if user is manager or superuser
 */
export const isAdmin = (user = null) => {
  return hasRole(['manager', 'superuser'], user);
};

/**
 * Check if user is a staff member
 * @param {object} user - User object
 * @returns {boolean} - True if user is staff
 */
export const isStaff = (user = null) => {
  return hasSpecificRole('staff', user);
};

/**
 * Check if user is a client
 * @param {object} user - User object
 * @returns {boolean} - True if user is client
 */
export const isClient = (user = null) => {
  return hasSpecificRole('client', user);
};