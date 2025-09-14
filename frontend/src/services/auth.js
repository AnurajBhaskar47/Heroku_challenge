import api from './api.js';

/**
 * Authentication service
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {number|null} year_of_study
 * @property {string} major
 * @property {string} timezone
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} access
 * @property {string} refresh
 * @property {User} user
 */

export const authService = {
    /**
     * Login user
     * @param {Object} credentials
     * @param {string} credentials.username
     * @param {string} credentials.password
     * @returns {Promise<AuthResponse>}
     */
    async login(credentials) {
        const response = await api.post('/auth/login/', credentials);
        return response.data;
    },

    /**
     * Register new user
     * @param {Object} userData
     * @param {string} userData.username
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {string} userData.first_name
     * @param {string} userData.last_name
     * @returns {Promise<AuthResponse>}
     */
    async register(userData) {
        const response = await api.post('/auth/register/', userData);
        return response.data;
    },

    /**
     * Get user profile
     * @returns {Promise<User>}
     */
    async getProfile() {
        const response = await api.get('/profile/');
        return response.data;
    },

    /**
     * Update user profile
     * @param {Partial<User>} userData
     * @returns {Promise<User>}
     */
    async updateProfile(userData) {
        const response = await api.patch('/profile/', userData);
        return response.data;
    },

    /**
     * Change password
     * @param {Object} passwords
     * @param {string} passwords.old_password
     * @param {string} passwords.new_password
     * @returns {Promise<{success: boolean}>}
     */
    async changePassword(passwords) {
        const response = await api.post('/profile/change-password/', passwords);
        return response.data;
    },

    /**
     * Refresh access token
     * @param {string} refreshToken
     * @returns {Promise<{access: string}>}
     */
    async refreshToken(refreshToken) {
        const response = await api.post('/auth/refresh/', {
            refresh: refreshToken,
        });
        return response.data;
    },

    /**
     * Logout user (if backend supports it)
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await api.post('/auth/logout/');
        } catch (error) {
            // Ignore errors on logout, we'll clear local storage anyway
            console.warn('Logout request failed:', error.message);
        }
    },
};
