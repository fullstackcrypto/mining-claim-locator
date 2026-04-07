import axios from 'axios';

// If REACT_APP_API_URL is not set or empty, API calls are disabled
// and the app will use embedded sample data instead.
const API_URL = process.env.REACT_APP_API_URL || null;

const api = {
  /** Returns true if a backend API is configured */
  isConfigured: () => Boolean(API_URL),
  
  checkHealth: () => {
    if (!API_URL) return Promise.reject(new Error('API not configured'));
    return axios.get(`${API_URL}/health`);
  },
  
  searchClaims: (params = {}) => {
    if (!API_URL) return Promise.reject(new Error('API not configured'));
    return axios.get(`${API_URL}/claims/search`, { params });
  },
  
  getClaimDetails: (id) => {
    if (!API_URL) return Promise.reject(new Error('API not configured'));
    return axios.get(`${API_URL}/claims/${id}`);
  },
  
  getCounties: () => {
    if (!API_URL) return Promise.reject(new Error('API not configured'));
    return axios.get(`${API_URL}/counties`);
  }
};

export default api;
