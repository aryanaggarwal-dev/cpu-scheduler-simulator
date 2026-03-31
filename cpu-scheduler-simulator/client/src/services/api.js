import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject({ ...error, message });
  }
);

export const simulateAPI = (payload) => api.post('/simulate', payload);
export const compareAPI = (payload) => api.post('/compare', payload);
export const getHistoryAPI = (params) => api.get('/history', { params });
export const saveSimulationAPI = (payload) => api.post('/save', payload);
export const deleteSimulationAPI = (id) => api.delete(`/history/${id}`);
export const healthAPI = () => api.get('/health');

export default api;
