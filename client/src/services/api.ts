import axios from 'axios';
import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    const orgId = localStorage.getItem('activeOrgId');
    if (orgId) {
      config.headers['x-organization-id'] = orgId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
