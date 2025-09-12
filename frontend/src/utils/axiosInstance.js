import axios from 'axios';

// IMPORTANT NOTE for future developers:
// The 'proxy' setting in package.json (set to http://localhost:3002) automatically
// prefixes all API requests with the backend server's address.
// 
// ⚠️  CRITICAL: This axiosInstance has baseURL: '/api' configured below.
// ⚠️  ALWAYS use paths starting with '/' (e.g., '/users', '/bookings', '/clients')
// ⚠️  NEVER use paths starting with 'api/' (e.g., 'api/users') as this creates double prefix '/api/api/users'
// 
// ✅ CORRECT: axiosInstance.get('/users') → makes request to '/api/users'
// ❌ WRONG:   axiosInstance.get('api/users') → makes request to '/api/api/users' (404 error)
// 
// This double prefix issue has been fixed multiple times. Please follow this pattern consistently.
const axiosInstance = axios.create({
  baseURL: '/api',
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