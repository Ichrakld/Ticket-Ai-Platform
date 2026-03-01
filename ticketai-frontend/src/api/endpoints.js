// src/api/endpoints.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  
  // Ticket endpoints
  TICKETS: {
    LIST: `${API_BASE_URL}/tickets/`,
    CREATE: `${API_BASE_URL}/tickets/`,
    DETAIL: (id) => `${API_BASE_URL}/tickets/${id}/`,
    UPDATE: (id) => `${API_BASE_URL}/tickets/${id}/`,
    DELETE: (id) => `${API_BASE_URL}/tickets/${id}/`,
    COMMENTS: (id) => `${API_BASE_URL}/tickets/${id}/comments/`,
  },
  
  // User endpoints
  USERS: {
    LIST: `${API_BASE_URL}/users/`,
    DETAIL: (id) => `${API_BASE_URL}/users/${id}/`,
  },
  
  // Statistics
  STATS: {
    DASHBOARD: `${API_BASE_URL}/stats/dashboard/`,
  },
};

export default ENDPOINTS;