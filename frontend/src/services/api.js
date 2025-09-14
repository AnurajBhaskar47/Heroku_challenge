import axios from 'axios';

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = () => {
    // In development, use the environment variable
    if (import.meta.env.DEV) {
        return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    }

    // In production, use the current origin
    return `${window.location.origin}/api`;
};

/**
 * Create axios instance with base configuration
 */
const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to add JWT token
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor to handle token refresh
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${getApiBaseUrl()}/auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');

                // Only redirect if we're not already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Helper function to handle API errors
 * @param {Error} error - The error object
 * @returns {string} Human readable error message
 */
export const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.response?.data?.detail) {
        return error.response.data.detail;
    }

    if (error.response?.data?.non_field_errors) {
        return error.response.data.non_field_errors.join(', ');
    }

    // Handle validation errors
    if (error.response?.data && typeof error.response.data === 'object') {
        const errors = [];
        Object.keys(error.response.data).forEach(key => {
            const fieldErrors = error.response.data[key];
            if (Array.isArray(fieldErrors)) {
                errors.push(`${key}: ${fieldErrors.join(', ')}`);
            } else if (typeof fieldErrors === 'string') {
                errors.push(`${key}: ${fieldErrors}`);
            }
        });
        if (errors.length > 0) {
            return errors.join('; ');
        }
    }

    if (error.message) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
};

export default api;
