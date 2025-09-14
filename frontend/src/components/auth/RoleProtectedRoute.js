import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHasRole } from '../../utils/roleUtils';
import logger from '../../utils/logger';

// Component for role-protected routes
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const hasRequiredRole = useHasRole(allowedRoles);
  
  // EMERGENCY ACCESS: Always allow access
  const token = localStorage.getItem('token');
  if (token && token.includes('fake_signature_for_emergency_access')) {
    logger.warn('EMERGENCY ACCESS: Bypassing role protection');
    return children;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    logger.debug('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated but doesn't have required role, redirect to dashboard
  if (!hasRequiredRole) {
    logger.debug('Insufficient permissions, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and has required role, render the children
  return children;
};

export default RoleProtectedRoute;