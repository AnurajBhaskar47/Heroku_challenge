/**
 * Resources API Service
 * 
 * Handles all resource-related API calls including:
 * - Resource CRUD operations
 * - File uploads with multipart/form-data
 * - RAG-powered AI study plan generation
 * - Resource recommendations and search
 */

import api from './api';

export const resourcesService = {
    /**
     * Get all resources for the authenticated user
     */
    async getResources(params = {}) {
        const response = await api.get('/resources', { params });
        return response.data;
    },

    /**
     * Get a specific resource by ID
     */
    async getResource(id) {
        const response = await api.get(`/resources/${id}/`);
        return response.data;
    },

    /**
     * Upload a new resource with file
     * @param {FormData} formData - FormData containing file and metadata
     */
    async uploadResource(formData) {
        const response = await api.post('/resources', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Update an existing resource
     */
    async updateResource(id, data) {
        const response = await api.patch(`/resources/${id}/`, data);
        return response.data;
    },

    /**
     * Delete a resource
     */
    async deleteResource(id) {
        const response = await api.delete(`/resources/${id}/`);
        return response.data;
    },

    /**
     * Search resources by query
     */
    async searchResources(query, filters = {}) {
        const params = {
            search: query,
            ...filters
        };
        const response = await api.get('/resources/search', { params });
        return response.data;
    },

    /**
     * Get resource statistics
     */
    async getResourceStats() {
        const response = await api.get('/resources/stats');
        return response.data;
    },

    // ==================== RAG-Powered Features ====================

    /**
     * Generate AI-powered study plan using RAG
     * @param {Object} request - Study plan generation request
     * @param {number} request.course_id - Course ID
     * @param {string} request.query - Natural language study plan request
     * @param {Object} request.preferences - Student preferences and constraints
     */
    async generateStudyPlan(request) {
        const response = await api.post('/resources/generate-study-plan', request);
        return response.data;
    },

    /**
     * Modify existing study plan using RAG
     * @param {number} studyPlanId - Study plan to modify
     * @param {string} modification - Natural language modification request
     */
    async modifyStudyPlan(studyPlanId, modification) {
        const response = await api.post(`/resources/modify-study-plan/${studyPlanId}/`, {
            modification_request: modification
        });
        return response.data;
    },

    /**
     * Get AI-powered resource recommendations
     * @param {Object} request - Recommendation request
     * @param {number} request.course_id - Course ID
     * @param {string} request.topic - Topic of interest
     * @param {number} request.difficulty_level - Preferred difficulty (1-5)
     * @param {string} request.learning_style - Learning style preference
     */
    async getResourceRecommendations(request) {
        const response = await api.post('/resources/recommendations', request);
        return response.data;
    },

    /**
     * Submit student context for personalized RAG
     * @param {Object} context - Student learning context
     */
    async submitStudyContext(context) {
        const response = await api.post('/resources/study-context', context);
        return response.data;
    },

    /**
     * Get student's study context
     * @param {number} courseId - Course ID
     */
    async getStudyContext(courseId) {
        const response = await api.get(`/resources/study-context/${courseId}/`);
        return response.data;
    },

    /**
     * Ask AI a question about course content
     * @param {Object} question - Question request
     * @param {number} question.course_id - Course ID
     * @param {string} question.question - Natural language question
     * @param {string} question.context_type - Type of context needed
     */
    async askAIQuestion(question) {
        const response = await api.post('/resources/ai-question', question);
        return response.data;
    },

    /**
     * Get semantic search results for study content
     * @param {Object} search - Search request
     * @param {number} search.course_id - Course ID
     * @param {string} search.query - Search query
     * @param {Array} search.content_types - Types of content to search
     * @param {number} search.top_k - Number of results to return
     */
    async semanticSearch(search) {
        const response = await api.post('/resources/semantic-search', search);
        return response.data;
    },

    /**
     * Get study progress analytics using AI insights
     * @param {number} courseId - Course ID
     */
    async getAIAnalytics(courseId) {
        const response = await api.get(`/resources/ai-analytics/${courseId}/`);
        return response.data;
    },

    /**
     * Provide feedback on AI-generated content
     * @param {Object} feedback - Feedback data
     * @param {string} feedback.query_id - ID of the RAG query
     * @param {string} feedback.rating - Rating (helpful, partially_helpful, not_helpful)
     * @param {string} feedback.comment - Optional feedback comment
     */
    async provideFeedback(feedback) {
        const response = await api.post('/resources/ai-feedback', feedback);
        return response.data;
    },

    // ==================== Document Processing ====================

    /**
     * Get document processing status
     * @param {number} resourceId - Resource ID
     */
    async getProcessingStatus(resourceId) {
        const response = await api.get(`/resources/${resourceId}/processing-status/`);
        return response.data;
    },

    /**
     * Get document chunks for a resource
     * @param {number} resourceId - Resource ID
     */
    async getDocumentChunks(resourceId) {
        const response = await api.get(`/resources/${resourceId}/chunks/`);
        return response.data;
    },

    /**
     * Get extracted topics from a resource
     * @param {number} resourceId - Resource ID
     */
    async getExtractedTopics(resourceId) {
        const response = await api.get(`/resources/${resourceId}/topics/`);
        return response.data;
    },

    // ==================== Knowledge Graph ====================

    /**
     * Get knowledge graph for a course
     * @param {number} courseId - Course ID
     */
    async getKnowledgeGraph(courseId) {
        const response = await api.get(`/resources/knowledge-graph/${courseId}/`);
        return response.data;
    },

    /**
     * Get prerequisite information for a topic
     * @param {number} courseId - Course ID
     * @param {string} topicName - Topic name
     */
    async getTopicPrerequisites(courseId, topicName) {
        const response = await api.get(`/resources/knowledge-graph/${courseId}/prerequisites/`, {
            params: { topic: topicName }
        });
        return response.data;
    },

    /**
     * Get learning path for a topic
     * @param {number} courseId - Course ID
     * @param {string} topicName - Topic name
     * @param {Object} preferences - Learning preferences
     */
    async getLearningPath(courseId, topicName, preferences = {}) {
        const response = await api.post(`/resources/learning-path/${courseId}/`, {
            topic: topicName,
            preferences
        });
        return response.data;
    }
};