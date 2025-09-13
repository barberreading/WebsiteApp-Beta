import axios from 'axios';
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
    // Do something with response error
    return Promise.reject(error);
  }
);

export default axiosInstance;