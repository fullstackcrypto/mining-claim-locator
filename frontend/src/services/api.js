import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = {
  checkHealth: () => axios.get(`${API_URL}/health`),
  searchClaims: (params = {}) => axios.get(`${API_URL}/claims/search`, { params }),
  getClaimDetails: (id) => axios.get(`${API_URL}/claims/${id}`)
};

export default api;
