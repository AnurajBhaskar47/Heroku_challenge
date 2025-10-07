import api from './api.js';

/**
 * AI Assistant service
 * @typedef {Object} ExplanationRequest
 * @property {string} topic
 * @property {string} context
 * @property {string} difficulty_level
 */

/**
 * @typedef {Object} ExplanationResponse
 * @property {string} text
 */

/**
 * @typedef {Object} StudyPlanRequest
 * @property {number} course_id
 * @property {Object} preferences
 */

/**
 * @typedef {Object} StudyPlanResponse
 * @property {boolean} success
 * @property {any} plan
 * @property {string} service_used
 */

/**
 * @typedef {Object} SearchRequest
 * @property {string} query
 * @property {string} resource_type
 * @property {number} limit
 */

/**
 * @typedef {Object} SearchResult
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} url
 */

/**
 * @typedef {Object} SearchResponse
 * @property {SearchResult[]} results
 */

export const aiService = {
    /**
     * Get AI explanation for a topic
     * @param {ExplanationRequest} data
     * @returns {Promise<ExplanationResponse>}
     */
    async getExplanation(data) {
        const response = await api.post('/ai-assistant/explain', data);
        return response.data;
    },

    /**
     * Generate enhanced study plan
     * @param {StudyPlanRequest} data
     * @returns {Promise<StudyPlanResponse>}
     */
    async generateStudyPlan(data) {
        const response = await api.post('/ai-assistant/enhanced-study-plan', data);
        return response.data;
    },

    /**
     * Perform semantic search
     * @param {SearchRequest} data
     * @returns {Promise<SearchResponse>}
     */
    async semanticSearch(data) {
        const response = await api.post('/ai-assistant/semantic-search', data);
        return response.data;
    },

    /**
     * Send a chat message to AI assistant
     * @param {string} message
     * @param {string} context
     * @returns {Promise<{response: string}>}
     */
    async sendChatMessage(message, context = '') {
        const response = await api.post('/ai-assistant/chat', {
            message,
            context,
        });
        return response.data;
    },
};
