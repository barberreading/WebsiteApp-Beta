import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Component for protected routes
const ProtectedRoute = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  // Emergency access removed - using normal authentication flow
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render the children
  return children;
};

export default ProtectedRoute;