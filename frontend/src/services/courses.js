import api from './api.js';

/**
 * Course service
 * @typedef {Object} Course
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {string} description
 * @property {string} instructor
 * @property {number} credits
 * @property {string} semester
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} difficulty_level
 * @property {string} syllabus_text
 */

/**
 * @typedef {Object} Assignment
 * @property {number} id
 * @property {number} course_id
 * @property {string} title
 * @property {string} assignment_type
 * @property {string} due_date
 * @property {number} estimated_hours
 * @property {string} status
 */

export const coursesService = {
    /**
     * Get all courses for current user
     * @returns {Promise<Course[]>}
     */
    async getCourses() {
        const response = await api.get('/courses/');
        return response.data;
    },

    /**
     * Get course by ID
     * @param {number} courseId
     * @returns {Promise<Course>}
     */
    async getCourse(courseId) {
        const response = await api.get(`/courses/${courseId}/`);
        return response.data;
    },

    /**
     * Create new course
     * @param {Partial<Course>} courseData
     * @returns {Promise<Course>}
     */
    async createCourse(courseData) {
        const response = await api.post('/courses/', courseData);
        return response.data;
    },

    /**
     * Update course
     * @param {number} courseId
     * @param {Partial<Course>} courseData
     * @returns {Promise<Course>}
     */
    async updateCourse(courseId, courseData) {
        const response = await api.put(`/courses/${courseId}/`, courseData);
        return response.data;
    },

    /**
     * Delete course
     * @param {number} courseId
     * @returns {Promise<void>}
     */
    async deleteCourse(courseId) {
        await api.delete(`/courses/${courseId}/`);
    },

    /**
     * Get assignments for a course
     * @param {number} courseId
     * @returns {Promise<Assignment[]>}
     */
    async getAssignments(courseId) {
        const response = await api.get(`/courses/${courseId}/assignments/`);
        return response.data;
    },

    /**
     * Create assignment
     * @param {number} courseId
     * @param {Partial<Assignment>} assignmentData
     * @returns {Promise<Assignment>}
     */
    async createAssignment(courseId, assignmentData) {
        const response = await api.post(`/courses/${courseId}/assignments/`, assignmentData);
        return response.data;
    },

    /**
     * Update assignment
     * @param {number} courseId
     * @param {number} assignmentId
     * @param {Partial<Assignment>} assignmentData
     * @returns {Promise<Assignment>}
     */
    async updateAssignment(courseId, assignmentId, assignmentData) {
        const response = await api.put(`/courses/${courseId}/assignments/${assignmentId}/`, assignmentData);
        return response.data;
    },

    /**
     * Delete assignment
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<void>}
     */
    async deleteAssignment(courseId, assignmentId) {
        await api.delete(`/courses/${courseId}/assignments/${assignmentId}/`);
    },

    /**
     * Mark assignment as in progress
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<Assignment>}
     */
    async markAssignmentInProgress(courseId, assignmentId) {
        const response = await api.post(`/courses/${courseId}/assignments/${assignmentId}/mark-in-progress/`);
        return response.data;
    },

    /**
     * Mark assignment as completed
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<Assignment>}
     */
    async markAssignmentCompleted(courseId, assignmentId) {
        const response = await api.post(`/courses/${courseId}/assignments/${assignmentId}/mark-completed/`);
        return response.data;
    },

    // ===========================================
    // Quiz Files Management
    // ===========================================

    /**
     * Get quiz files for a course
     * @param {number} courseId
     * @returns {Promise<Object[]>}
     */
    async getQuizFiles(courseId) {
        const response = await api.get(`/courses/${courseId}/quiz-files/`);
        return response.data;
    },

    /**
     * Upload a quiz file
     * @param {number} courseId
     * @param {Object} quizData
     * @param {string} quizData.title
     * @param {string} quizData.description
     * @param {File} quizData.file
     * @returns {Promise<Object>}
     */
    async uploadQuizFile(courseId, quizData) {
        const formData = new FormData();
        formData.append('title', quizData.title);
        if (quizData.description) {
            formData.append('description', quizData.description);
        }
        formData.append('file', quizData.file);

        const response = await api.post(`/courses/${courseId}/quiz-files/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Delete a quiz file
     * @param {number} courseId
     * @param {number} quizId
     * @returns {Promise<void>}
     */
    async deleteQuizFile(courseId, quizId) {
        await api.delete(`/courses/${courseId}/quiz-files/${quizId}/`);
    },

    // ===========================================
    // Assignment Files Management
    // ===========================================

    /**
     * Get assignment files for a course
     * @param {number} courseId
     * @returns {Promise<Object[]>}
     */
    async getAssignmentFiles(courseId) {
        const response = await api.get(`/courses/${courseId}/assignment-files/`);
        return response.data;
    },

    /**
     * Upload an assignment file
     * @param {number} courseId
     * @param {Object} assignmentData
     * @param {string} assignmentData.title
     * @param {string} assignmentData.description
     * @param {File} assignmentData.file
     * @returns {Promise<Object>}
     */
    async uploadAssignmentFile(courseId, assignmentData) {
        const formData = new FormData();
        formData.append('title', assignmentData.title);
        if (assignmentData.description) {
            formData.append('description', assignmentData.description);
        }
        formData.append('file', assignmentData.file);

        const response = await api.post(`/courses/${courseId}/assignment-files/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Delete an assignment file
     * @param {number} courseId
     * @param {number} assignmentFileId
     * @returns {Promise<void>}
     */
    async deleteAssignmentFile(courseId, assignmentFileId) {
        await api.delete(`/courses/${courseId}/assignment-files/${assignmentFileId}/`);
    },

    // ===========================================
    // Course Topics Management
    // ===========================================

    /**
     * Get course topics for a course
     * @param {number} courseId
     * @returns {Promise<Object[]>}
     */
    async getCourseTopics(courseId) {
        const response = await api.get(`/courses/${courseId}/topics/`);
        return response.data;
    },

    /**
     * Create course topics from syllabus content
     * @param {number} courseId
     * @param {FormData} topicData - FormData containing syllabus_text or syllabus_file
     * @returns {Promise<Object>}
     */
    async createCourseTopics(courseId, topicData) {
        const response = await api.post(`/courses/${courseId}/topics/`, topicData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Update course topics
     * @param {number} courseId
     * @param {number} topicId
     * @param {FormData} topicData
     * @returns {Promise<Object>}
     */
    async updateCourseTopics(courseId, topicId, topicData) {
        const response = await api.put(`/courses/${courseId}/topics/${topicId}/`, topicData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Delete course topics
     * @param {number} courseId
     * @param {number} topicId
     * @returns {Promise<void>}
     */
    async deleteCourseTopics(courseId, topicId) {
        await api.delete(`/courses/${courseId}/topics/${topicId}/`);
    },

    /**
     * Reprocess course topics to extract topics again
     * @param {number} courseId
     * @param {number} topicId
     * @returns {Promise<Object>}
     */
    async reprocessCourseTopics(courseId, topicId) {
        const response = await api.post(`/courses/${courseId}/topics/${topicId}/reprocess/`);
        return response.data;
    },

    // Course Topic Items Management (Individual Topic Cards)
    /**
     * Get all topic items for a course
     * @param {number} courseId
     * @returns {Promise<Array>}
     */
    async getCourseTopicItems(courseId) {
        const response = await api.get(`/courses/${courseId}/topic-items/`);
        return response.data;
    },

    /**
     * Create a new topic item
     * @param {number} courseId
     * @param {Object} topicItemData
     * @returns {Promise<Object>}
     */
    async createCourseTopicItem(courseId, topicItemData) {
        const response = await api.post(`/courses/${courseId}/topic-items/`, topicItemData);
        return response.data;
    },

    /**
     * Update a topic item
     * @param {number} courseId
     * @param {number} topicItemId
     * @param {Object} topicItemData
     * @returns {Promise<Object>}
     */
    async updateCourseTopicItem(courseId, topicItemId, topicItemData) {
        const response = await api.patch(`/courses/${courseId}/topic-items/${topicItemId}/`, topicItemData);
        return response.data;
    },

    /**
     * Delete a topic item
     * @param {number} courseId
     * @param {number} topicItemId
     * @returns {Promise<Object>}
     */
    async deleteCourseTopicItem(courseId, topicItemId) {
        const response = await api.delete(`/courses/${courseId}/topic-items/${topicItemId}/`);
        return response.data;
    },

    /**
     * Toggle completion status of a topic item
     * @param {number} courseId
     * @param {number} topicItemId
     * @returns {Promise<Object>}
     */
    async toggleTopicItemCompletion(courseId, topicItemId) {
        const response = await api.post(`/courses/${courseId}/topic-items/${topicItemId}/toggle-completion/`);
        return response.data;
    },

    /**
     * Reorder topic items
     * @param {number} courseId
     * @param {Array} topicOrders
     * @returns {Promise<Object>}
     */
    async reorderTopicItems(courseId, topicOrders) {
        const response = await api.post(`/courses/${courseId}/topic-items/reorder/`, {
            topic_orders: topicOrders
        });
        return response.data;
    },
};
