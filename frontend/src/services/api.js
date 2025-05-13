// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = {
  // Get all expired claims with optional filters
  getExpiredClaims: (params = {}) => {
    return axios.get(`${API_URL}/claims/expired`, { params });
  },
  
  // Get single claim details
  getClaimDetails: (id) => {
    return axios.get(`${API_URL}/claims/${id}`);
  },
  
  // Search claims by location
  searchByLocation: (lat, lng, radius = 5000) => {
    return axios.get(`${API_URL}/search/location`, {
      params: { lat, lng, radius }
    });
  },
  
  // Get list of counties
  getCounties: () => {
    return axios.get(`${API_URL}/metadata/counties`);
  },
  
  // Trigger data refresh
  refreshData: () => {
    return axios.post(`${API_URL}/refresh`);
  }
};

export default api;
