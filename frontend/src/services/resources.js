import api from './api.js';

/**
 * Resources service
 * @typedef {Object} Resource
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} url
 * @property {string} resource_type
 * @property {string} subject
 * @property {string} difficulty_level
 * @property {string} created_at
 */

export const resourcesService = {
    /**
     * Get all resources
     * @param {Object} params
     * @param {string} params.search
     * @param {string} params.resource_type
     * @param {string} params.subject
     * @param {string} params.difficulty_level
     * @returns {Promise<Resource[]>}
     */
    async getResources(params = {}) {
        const response = await api.get('/resources/', { params });
        return response.data;
    },

    /**
     * Get resource by ID
     * @param {number} resourceId
     * @returns {Promise<Resource>}
     */
    async getResource(resourceId) {
        const response = await api.get(`/resources/${resourceId}/`);
        return response.data;
    },

    /**
     * Create new resource
     * @param {Partial<Resource>} resourceData
     * @returns {Promise<Resource>}
     */
    async createResource(resourceData) {
        const response = await api.post('/resources/', resourceData);
        return response.data;
    },

    /**
     * Update resource
     * @param {number} resourceId
     * @param {Partial<Resource>} resourceData
     * @returns {Promise<Resource>}
     */
    async updateResource(resourceId, resourceData) {
        const response = await api.patch(`/resources/${resourceId}/`, resourceData);
        return response.data;
    },

    /**
     * Delete resource
     * @param {number} resourceId
     * @returns {Promise<void>}
     */
    async deleteResource(resourceId) {
        await api.delete(`/resources/${resourceId}/`);
    },

    /**
     * Search resources using semantic search
     * @param {string} query
     * @param {Object} options
     * @param {string} options.resource_type
     * @param {number} options.limit
     * @returns {Promise<Resource[]>}
     */
    async searchResources(query, options = {}) {
        const response = await api.post('/resources/search/', {
            query,
            ...options,
        });
        return response.data.results || response.data;
    },

    /**
     * Rate resource
     * @param {number} resourceId
     * @param {number} rating
     * @returns {Promise<Resource>}
     */
    async rateResource(resourceId, rating) {
        const response = await api.post(`/resources/${resourceId}/rate/`, {
          rating: rating,
        });
        return response.data;
    },
};
