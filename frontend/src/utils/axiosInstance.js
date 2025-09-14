import axios from 'axios';
import axiosRetry from 'axios-retry';
import { API_URL } from '../config';

// IMPORTANT NOTE for future developers:
// In Electron environment, the proxy setting in package.json doesn't work.
// We need to use the full API URL from config.js instead of relying on proxy.
// 
// ⚠️  CRITICAL: This axiosInstance now uses full API URL + '/api' as baseURL.
// ⚠️  ALWAYS use paths starting with '/' (e.g., '/users', '/bookings', '/clients')
// ⚠️  NEVER use paths starting with 'api/' (e.g., 'api/users') as this creates double prefix '/api/api/users'
// 
// ✅ CORRECT: axiosInstance.get('/users') → makes request to 'http://localhost:3002/api/users'
// ❌ WRONG:   axiosInstance.get('api/users') → makes request to 'http://localhost:3002/api/api/users' (404 error)
// 
// This configuration works in both development and Electron environments.
const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // 10 second timeout
});

// Configure axios-retry for automatic retries on network errors and server issues
axiosRetry(axiosInstance, {
  retries: 3, // Number of retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff delay
  retryCondition: (error) => {
    // Retry on network errors
    if (axiosRetry.isNetworkError(error)) {
      console.log('Network error detected, retrying...', error.message);
      return true;
    }
    
    // Retry on 5xx server errors (but not 4xx client errors)
    if (axiosRetry.isRetryableError(error)) {
      console.log('Server error detected, retrying...', error.response?.status);
      return true;
    }
    
    // Retry on timeout errors
    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout, retrying...', error.message);
      return true;
    }
    
    // Retry on connection refused (server down)
    if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused, server may be down, retrying...', error.message);
      return true;
    }
    
    // Don't retry on authentication errors (401) or client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    
    return false;
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt ${retryCount} for ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
  },
});

export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axiosInstance.defaults.headers.common['x-auth-token'];
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling with user-friendly messages
    if (error.response) {
      // Server responded with error status
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;