import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Component for role-based route protection
const RoleRoute = ({ allowedRoles, roles, children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  // Use either allowedRoles or roles prop (for backward compatibility)
  const effectiveRoles = allowedRoles || roles || [];
  
  // Emergency access removed - using normal authentication flow
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Safety check for undefined user
  if (!currentUser) {
    logger.error('User is undefined in RoleRoute');
    return <Navigate to="/login" replace />;
  }
  
  // Always allow superuser access to all routes
  if (currentUser.role === 'superuser' || currentUser.role === 'admin') {
    logger.log('Superuser/Admin access granted');
    return children;
  }
  
  // If user role is allowed, render the route
  if (effectiveRoles.includes(currentUser.role)) {
    return children;
  }
  
  logger.log('Access denied for role:', currentUser.role, 'Required roles:', effectiveRoles);
  
  // If user's role is not allowed, redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default RoleRoute;