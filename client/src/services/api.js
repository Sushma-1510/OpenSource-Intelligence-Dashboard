import axios from 'axios';

// Set up default API base URL (Vite allows overrides via import.meta.env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor for centralized error management
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.error || error.message || 'Unknown network error';
    console.error(`[API Error Interceptor] Msg: ${errorMsg}`, error);
    
    // We pass along the error message so the caller hooks can capture it cleanly
    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;
