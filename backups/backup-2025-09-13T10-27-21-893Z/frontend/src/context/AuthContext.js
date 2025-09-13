import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../utils/axiosInstance';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState(null);
  
  // Mutex for preventing concurrent auth operations
  const authMutex = useRef(false);
  const pendingRequests = useRef(new Map());
  
  // Debounce helper for auth operations
  const debounceTimeout = useRef(null);
  
  // Wrapper to debug setCurrentUser calls
  const setCurrentUser = (user) => {
    if (user === null && currentUser !== null) {
      console.log('🚨 setCurrentUser(null) called - User being logged out:');
      console.log('Stack trace:', new Error().stack);
      console.log('Previous user:', currentUser);
      console.log('Timestamp:', new Date().toISOString());
    }
    setCurrentUserState(user);
  };
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false); // New state
  const [originalUser, setOriginalUser] = useState(null);
  const [impersonating, setImpersonating] = useState(false);

  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axiosInstance.defaults.headers.common['x-auth-token'] = token; // Add for backward compatibility
      localStorage.setItem('token', token);
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      delete axiosInstance.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  // Load user from token with mutex protection
  const loadUser = async () => {
    // Prevent concurrent loadUser calls
    if (authMutex.current) {
      return;
    }
    
    authMutex.current = true;
    
    try {
      const tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        setAuthToken(tokenFromStorage);
        try {
          // Set timeout to prevent hanging on API calls
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const res = await axiosInstance.get('/auth/me', {
          signal: controller.signal
        });
            
            clearTimeout(timeoutId);
            setCurrentUser(res.data);
            setIsAuthenticated(true);
            setIsUserLoaded(true); // Set user loaded
          } catch (apiErr) {
            clearTimeout(timeoutId);
            throw apiErr; // Re-throw to be caught by outer catch
          }
        } catch (err) {
          console.error('Error loading user:', err);
          
          // DISABLED: Emergency fallback - using normal authentication
          // console.log('Backend connection failed - activating emergency access');
          // const emergencyUser = {
          //   _id: 'emergency_fallback_id',
          //   id: 'emergency_fallback_id', 
          //   name: 'Emergency Access',
          //   email: 'admin@example.com',
          //   role: 'admin'
          // };
          // setCurrentUser(emergencyUser);
          // setIsAuthenticated(true);
          
          // Clear authentication on error
          logout();
        }
      }
      setIsUserLoaded(true); // Also set loaded here for cases with no token
      setLoading(false);
    } finally {
      authMutex.current = false;
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      const res = await axiosInstance.post('/auth/register', userData);
      if (res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
        await loadUser();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Registration failed'
      };
    }
  };

  // Login user with mutex protection and debouncing
  const login = async (email, password, rememberMe = false) => {
    // Prevent concurrent login calls
    if (authMutex.current) {
      return { success: false, error: 'Login already in progress' };
    }
    
    // Clear any pending debounced operations
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    authMutex.current = true;
    
    try {
      setLoading(true);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const res = await axiosInstance.post('/auth/login', { email, password, rememberMe }, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (res.data.token) {
            setToken(res.data.token);
            setAuthToken(res.data.token);
            
            // If user data is returned directly, set it to prevent UI lag
            if (res.data.user) {
              setCurrentUser(res.data.user);
              setIsAuthenticated(true);
              setIsUserLoaded(true);
            }
            
            // Always load user to ensure data is fresh and complete
            await loadUser();
            
            setLoading(false);
            return { 
              success: true,
              isTemporaryPassword: res.data.isTemporaryPassword 
            };
          } else {
            setLoading(false);
            return {
              success: false,
              error: 'Invalid login response'
            };
          }
        } catch (apiErr) {
          clearTimeout(timeoutId);
          throw apiErr; // Re-throw to be caught by outer catch
        }
      } catch (err) {
        setLoading(false);
        return {
          success: false,
          error: err.response?.data?.msg || 'Invalid credentials'
        };
      }
    } finally {
      authMutex.current = false;
    }
  };

  // Logout user with mutex protection and token blacklisting
   const logout = async () => {
     // Prevent concurrent logout calls
     if (authMutex.current) {
       return;
     }
     
     // Clear any pending debounced operations
     if (debounceTimeout.current) {
       clearTimeout(debounceTimeout.current);
     }
     
     authMutex.current = true;
     
     try {
       // Call backend logout to blacklist token
       const token = localStorage.getItem('token');
       if (token) {
         try {
           await axiosInstance.post('/auth/logout');
         } catch (err) {
           console.error('Error during logout:', err);
           // Continue with local logout even if backend call fails
         }
       }
       
       // Clear user state
       setCurrentUser(null);
       setIsAuthenticated(false);
       setAuthToken(null);
       setToken(null);
       setIsUserLoaded(false);
       setLoading(false);
       
       // Clear localStorage
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       localStorage.removeItem('selectedEmployees');
     } finally {
       authMutex.current = false;
     }
   };

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    // Standard role check with null safety
    if (!currentUser || !currentUser.role) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  }, [currentUser]);

  // Debug function to display stored logout information
  const getLogoutDebugInfo = () => {
    const debugKeys = Object.keys(localStorage).filter(key => key.startsWith('logout_debug_'));
    const debugInfo = debugKeys.map(key => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (e) {
        return null;
      }
    }).filter(info => info !== null);
    
    console.log('📊 LOGOUT DEBUG HISTORY:');
    debugInfo.forEach((info, index) => {
      console.log(`--- Logout Event ${index + 1} ---`);
      console.log('Timestamp:', info.timestamp);
      console.log('URL:', info.url);
      console.log('User:', info.currentUser?.name || 'None');
      console.log('Was Authenticated:', info.isAuthenticated);
      console.log('Stack Trace:', info.stackTrace);
      console.log('---');
    });
    
    return debugInfo;
  };

  // Check if token is expired
  const isTokenExpired = () => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true;
    }
  };
  
  // Cross-tab synchronization handler
  const handleStorageChange = useCallback((e) => {
    if (e.key === 'token') {
      if (e.newValue === null) {
        // Token was removed in another tab - logout
        if (currentUser) {
          console.log('Authentication session ended in another tab - logging out');
          logout();
        }
      } else if (e.newValue !== localStorage.getItem('token')) {
        // Token was updated in another tab - reload user
        console.log('Authentication session updated in another tab - reloading user');
        debounceTimeout.current = setTimeout(() => {
          loadUser();
        }, 100); // Small delay to prevent race conditions
      }
    }
  }, [currentUser]);
  
  // Change password with token blacklisting
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.post('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      
      // If a new token is returned, update it
      if (res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
        // Reload user data with new token
        await loadUser();
      }
      
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Failed to change password'
      };
    }
  };
  
  // Update email
  const updateEmail = async (email, password) => {
    try {
      const res = await axiosInstance.post('/users/update-email', { 
        email, 
        password 
      });
      await loadUser(); // Reload user to get updated email
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Failed to update email'
      };
    }
  };
  
  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
        return { success: true, message: response.data.msg };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Failed to process request'
      };
    }
  };
  
  // Reset password
  const resetPassword = async (resetToken, newPassword) => {
    try {
      const res = await axiosInstance.post(`/auth/reset-password/${resetToken}`, {
        password: newPassword,
      });
      return { success: true, message: res.data.msg };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Failed to reset password'
      };
    }
  };

  useEffect(() => {
    // Load user from token if it exists
    const loadUserFromToken = async () => {
      if (currentUser) {
        return;
      }
      
      if (token) {
        await loadUser();
      }
      
      setLoading(false);
    };
    
    loadUserFromToken();
    
    // Make debug function globally available
    window.getLogoutDebugInfo = getLogoutDebugInfo;
    
    // Add storage event listener for cross-tab synchronization
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup event listener on component unmount
    return () => {
      delete window.getLogoutDebugInfo;
      window.removeEventListener('storage', handleStorageChange);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
    // eslint-disable-next-line
  }, [getLogoutDebugInfo, handleStorageChange]);
  
  // Impersonate user (for superuser only)
  const impersonateUser = async (userRole) => {
    if (currentUser?.role !== 'superuser' && !impersonating) {
      return { success: false, error: 'Only superusers can impersonate other users' };
    }
    
    // Save original user if not already impersonating
    if (!impersonating) {
      setOriginalUser(currentUser);
    }
    
    try {
      // Define specific test users for each role
      const testUsers = {
        client: {
          name: 'Test Nursery',
          email: 'everythingchildcare@gmail.com',
          _id: '507f1f77bcf86cd799439011' // Placeholder ID
        },
        staff: {
          name: 'Test Booker',
          email: 'barberreading@hotmail.co.uk', 
          _id: '68b9830c359b9f1180a0aa8e' // Known Test Booker ID
        },
        manager: {
          name: 'Test Admin',
          email: 'accounts@everythingchildcareagency.co.uk',
          _id: '68c52f31d5694eb7e895904e' // Test Admin ID we just created
        },
        admin: {
          name: 'Test Admin',
          email: 'accounts@everythingchildcareagency.co.uk',
          _id: '68c52f31d5694eb7e895904e' // Same as manager - admin and manager are same role level
        }
      };
      
      // Get the specific test user for this role
      const testUserData = testUsers[userRole];
      
      if (testUserData) {
        // For client role, fetch the actual Test Nursery client data
        if (userRole === 'client') {
          try {
            const response = await axiosInstance.get('/clients');
            const testNursery = response.data.find(client => 
              client.name?.toLowerCase().includes('test nursery') ||
              client.firstName?.toLowerCase().includes('test') && client.lastName?.toLowerCase().includes('nursery')
            );
            
            if (testNursery) {
              testUserData._id = testNursery._id;
              testUserData.name = testNursery.name || `${testNursery.firstName} ${testNursery.lastName}`;
              testUserData.email = testNursery.email;
            }
          } catch (error) {
            console.warn('Could not fetch Test Nursery client data:', error);
          }
        }
        
        // Create impersonated user with specific test user data
        const impersonatedUser = {
          ...currentUser,
          ...testUserData,
          role: userRole,
          _impersonated: true,
          _testUser: true
        };
        
        setCurrentUser(impersonatedUser);
        setImpersonating(true);
        
        return { success: true, testUser: testUserData.name };
      } else {
        // Fallback to generic role impersonation
        const impersonatedUser = {
          ...currentUser,
          role: userRole,
          _impersonated: true
        };
        
        setCurrentUser(impersonatedUser);
        setImpersonating(true);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Error during impersonation:', error);
      return { success: false, error: 'Failed to impersonate user' };
    }
  };
  
  // Return to original user
  const stopImpersonating = () => {
    if (!impersonating || !originalUser) {
      return { success: false, error: 'Not currently impersonating' };
    }
    
    setCurrentUser(originalUser);
    setImpersonating(false);
    setOriginalUser(null);
    
    return { success: true };
  };

  const value = {
    user: currentUser, // Keep for backward compatibility
    currentUser, // Add explicit currentUser property
    token,
    loading,
    isAuthenticated,
    isUserLoaded, // Export new state
    register,
    login,
    logout,
    hasRole,
    isTokenExpired,
    changePassword,
    updateEmail,
    forgotPassword,
    resetPassword,
    loadUser,
    impersonateUser,
    stopImpersonating,
    impersonating,
    getLogoutDebugInfo, // Add debug function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};