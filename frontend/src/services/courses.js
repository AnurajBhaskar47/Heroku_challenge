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
};
