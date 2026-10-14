import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api');
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to inject JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are already on login or register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('campus_token');
        localStorage.removeItem('campus_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data)
};

export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  assign: (id, data) => api.post(`/complaints/${id}/assign`, data),
  accept: (id) => api.post(`/complaints/${id}/accept`),
  startProgress: (id, data) => api.post(`/complaints/${id}/in-progress`, data),
  resolve: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/complaints/${id}/resolve`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post(`/complaints/${id}/resolve`, data);
  },
  close: (id, data) => api.post(`/complaints/${id}/close`, data),
  reopen: (id, data) => api.post(`/complaints/${id}/reopen`, data),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
  uploadAttachment: (id, formData) => api.post(`/complaints/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const metadataAPI = {
  getCategories: () => api.get('/categories'),
  getLocations: () => api.get('/locations'),
  getStaffUsers: () => api.get('/users/staff'),
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { account_status: status })
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getStaffWorkload: () => api.get('/analytics/staff-workload'),
  getSlaList: () => api.get('/sla'),
  updateSla: (priority, data) => api.put(`/sla/${priority}`, data)
};

export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getExportUrl: () => `${API_BASE_URL}/reports/export-csv`
};

export default api;
