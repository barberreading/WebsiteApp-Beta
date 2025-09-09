import axios from 'axios';

// Note for future developers:
// The 'proxy' setting in package.json (set to http://localhost:3002) automatically
// prefixes all API requests with the backend server's address.
// All API requests should be made to relative paths, and they will be prefixed with '/api'.
// For example, use axios.get('/users') to make a request to '/api/users' (the /api prefix is automatically added by the backend routing).
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