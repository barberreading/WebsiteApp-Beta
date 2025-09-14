import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosInstance'; // Import axiosInstance

// This component monitors network connectivity and provides global error handling
const NetworkErrorHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasBackendConnection, setHasBackendConnection] = useState(true);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Your internet connection has been restored');
      checkBackendConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are currently offline. Please check your internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial backend connection check
    checkBackendConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodically check backend connection when online
  useEffect(() => {
    let intervalId;
    
    if (isOnline) {
      intervalId = setInterval(() => {
        checkBackendConnection();
      }, 60000); // Check every 60 seconds (reduced frequency to avoid hitting MongoDB connection limits)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline]);

  // Function to check backend connection
  const checkBackendConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try multiple endpoints in case one is not available
      const endpoints = [
        '/health',
        '/users/me',
        '/'
      ];
      
      let connected = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await axiosInstance.get(endpoint, { // Use axiosInstance
            signal: controller.signal,
          });
          
          if (response.status < 500) { // Accept any non-server error as "connected"
            connected = true;
            break;
          }
        } catch (err) {
          logger.log(`Failed to connect to ${endpoint}:`, err.message);
          // Continue to next endpoint
        }
      }
      
      clearTimeout(timeoutId);
      
      if (connected) {
        if (!hasBackendConnection) {
          setHasBackendConnection(true);
          toast.success('Connection to the server has been restored');
        }
      } else {
        handleBackendConnectionError();
      }
    } catch (error) {
      handleBackendConnectionError();
    }
  };

  const handleBackendConnectionError = () => {
    if (hasBackendConnection) {
      setHasBackendConnection(false);
      toast.error('Unable to connect to the server. Some features may not work properly');
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default NetworkErrorHandler;