import api from './api.js';

/**
 * Study Plans service
 * @typedef {Object} StudyPlan
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} status
 * @property {number} progress_percentage
 * @property {any} plan_data
 */

export const plansService = {
    /**
     * Get all study plans for current user
     * @returns {Promise<StudyPlan[]>}
     */
    async getPlans() {
        const response = await api.get('/study-plans');
        return response.data;
    },

    /**
     * Get study plan by ID
     * @param {number} planId
     * @returns {Promise<StudyPlan>}
     */
    async getPlan(planId) {
        const response = await api.get(`/study-plans/${planId}/`);
        return response.data;
    },

    /**
     * Create new study plan
     * @param {Partial<StudyPlan>} planData
     * @returns {Promise<StudyPlan>}
     */
    async createPlan(planData) {
        const response = await api.post('/study-plans', planData);
        return response.data;
    },

    /**
     * Update study plan
     * @param {number} planId
     * @param {Partial<StudyPlan>} planData
     * @returns {Promise<StudyPlan>}
     */
    async updatePlan(planId, planData) {
        const response = await api.patch(`/study-plans/${planId}/`, planData);
        return response.data;
    },

    /**
     * Delete study plan
     * @param {number} planId
     * @returns {Promise<void>}
     */
    async deletePlan(planId) {
        await api.delete(`/study-plans/${planId}/`);
    },

    /**
     * Update plan progress
     * @param {number} planId
     * @param {number} progress
     * @returns {Promise<StudyPlan>}
     */
    async updateProgress(planId, progress) {
        const response = await api.post(`/study-plans/${planId}/update-progress/`, {
            progress_percentage: progress,
        });
        return response.data;
    },

    /**
     * Activate study plan
     * @param {number} planId
     * @returns {Promise<StudyPlan>}
     */
    async activatePlan(planId) {
        const response = await api.post(`/study-plans/${planId}/activate/`);
        return response.data;
    },

    /**
     * Get study plan statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        const response = await api.get('/study-plans/stats');
        return response.data;
    },

    /**
     * Get active study plans
     * @returns {Promise<StudyPlan[]>}
     */
    async getActivePlans() {
        const response = await api.get('/study-plans/active');
        return response.data;
    },

    /**
     * Get overdue study plans
     * @returns {Promise<StudyPlan[]>}
     */
    async getOverduePlans() {
        const response = await api.get('/study-plans/overdue');
        return response.data;
    },

    /**
     * Pause study plan
     * @param {number} planId
     * @returns {Promise<StudyPlan>}
     */
    async pausePlan(planId) {
        const response = await api.post(`/study-plans/${planId}/pause/`);
        return response.data;
    },

    /**
     * Complete study plan
     * @param {number} planId
     * @returns {Promise<StudyPlan>}
     */
    async completePlan(planId) {
        const response = await api.post(`/study-plans/${planId}/complete/`);
        return response.data;
    },

    /**
     * Duplicate study plan
     * @param {number} planId
     * @returns {Promise<StudyPlan>}
     */
    async duplicatePlan(planId) {
        const response = await api.post(`/study-plans/${planId}/duplicate/`);
        return response.data;
    },

    /**
     * Update topic completion status
     * @param {number} planId
     * @param {string} topicId
     * @param {boolean} completed
     * @returns {Promise<StudyPlan>}
     */
    async updateTopicCompletion(planId, topicId, completed) {
        const response = await api.post(`/study-plans/${planId}/update-topic/`, {
            topic_id: topicId,
            completed: completed,
        });
        return response.data;
    },
      
};
