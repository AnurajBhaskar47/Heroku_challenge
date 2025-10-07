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
        const response = await api.get('/courses');
        return response.data;
    },

    /**
     * Get course by ID
     * @param {number} courseId
     * @returns {Promise<Course>}
     */
    async getCourse(courseId) {
        const response = await api.get(`/courses/${courseId}`);
        return response.data;
    },

    /**
     * Create new course
     * @param {Partial<Course>} courseData
     * @returns {Promise<Course>}
     */
    async createCourse(courseData) {
        const response = await api.post('/courses', courseData);
        return response.data;
    },

    /**
     * Update course
     * @param {number} courseId
     * @param {Partial<Course>} courseData
     * @returns {Promise<Course>}
     */
    async updateCourse(courseId, courseData) {
        const response = await api.put(`/courses/${courseId}`, courseData);
        return response.data;
    },

    /**
     * Delete course
     * @param {number} courseId
     * @returns {Promise<void>}
     */
    async deleteCourse(courseId) {
        await api.delete(`/courses/${courseId}`);
    },

    /**
     * Get assignments for a course
     * @param {number} courseId
     * @returns {Promise<Assignment[]>}
     */
    async getAssignments(courseId) {
        const response = await api.get(`/courses/${courseId}/assignments`);
        return response.data;
    },

    /**
     * Create assignment
     * @param {number} courseId
     * @param {Partial<Assignment>} assignmentData
     * @returns {Promise<Assignment>}
     */
    async createAssignment(courseId, assignmentData) {
        const response = await api.post(`/courses/${courseId}/assignments`, assignmentData);
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
        const response = await api.put(`/courses/${courseId}/assignments/${assignmentId}`, assignmentData);
        return response.data;
    },

    /**
     * Delete assignment
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<void>}
     */
    async deleteAssignment(courseId, assignmentId) {
        await api.delete(`/courses/${courseId}/assignments/${assignmentId}`);
    },

    /**
     * Mark assignment as in progress
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<Assignment>}
     */
    async markAssignmentInProgress(courseId, assignmentId) {
        const response = await api.post(`/courses/${courseId}/assignments/${assignmentId}/mark-in-progress`);
        return response.data;
    },

    /**
     * Mark assignment as completed
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<Assignment>}
     */
    async markAssignmentCompleted(courseId, assignmentId) {
        const response = await api.post(`/courses/${courseId}/assignments/${assignmentId}/mark-completed`);
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
        const response = await api.get(`/courses/${courseId}/quiz-files`);
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

        const response = await api.post(`/courses/${courseId}/quiz-files`, formData, {
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
        await api.delete(`/courses/${courseId}/quiz-files/${quizId}`);
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
        const response = await api.get(`/courses/${courseId}/assignment-files`);
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

        const response = await api.post(`/courses/${courseId}/assignment-files`, formData, {
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
        await api.delete(`/courses/${courseId}/assignment-files/${assignmentFileId}`);
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
        const response = await api.get(`/courses/${courseId}/topics`);
        return response.data;
    },

    /**
     * Create course topics from syllabus content
     * @param {number} courseId
     * @param {FormData} topicData - FormData containing syllabus_text or syllabus_file
     * @returns {Promise<Object>}
     */
    async createCourseTopics(courseId, topicData) {
        const response = await api.post(`/courses/${courseId}/topics`, topicData, {
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
        const response = await api.put(`/courses/${courseId}/topics/${topicId}`, topicData, {
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
        await api.delete(`/courses/${courseId}/topics/${topicId}`);
    },

    /**
     * Reprocess course topics to extract topics again
     * @param {number} courseId
     * @param {number} topicId
     * @returns {Promise<Object>}
     */
    async reprocessCourseTopics(courseId, topicId) {
        const response = await api.post(`/courses/${courseId}/topics/${topicId}/reprocess`);
        return response.data;
    },

    // Course Topic Items Management (Individual Topic Cards)
    /**
     * Get all topic items for a course
     * @param {number} courseId
     * @returns {Promise<Array>}
     */
    async getCourseTopicItems(courseId) {
        const response = await api.get(`/courses/${courseId}/topic-items`);
        return response.data;
    },

    /**
     * Create a new topic item
     * @param {number} courseId
     * @param {Object} topicItemData
     * @returns {Promise<Object>}
     */
    async createCourseTopicItem(courseId, topicItemData) {
        const response = await api.post(`/courses/${courseId}/topic-items`, topicItemData);
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
        const response = await api.patch(`/courses/${courseId}/topic-items/${topicItemId}`, topicItemData);
        return response.data;
    },

    /**
     * Delete a topic item
     * @param {number} courseId
     * @param {number} topicItemId
     * @returns {Promise<Object>}
     */
    async deleteCourseTopicItem(courseId, topicItemId) {
        const response = await api.delete(`/courses/${courseId}/topic-items/${topicItemId}`);
        return response.data;
    },

    /**
     * Toggle completion status of a topic item
     * @param {number} courseId
     * @param {number} topicItemId
     * @returns {Promise<Object>}
     */
    async toggleTopicItemCompletion(courseId, topicItemId) {
        const response = await api.post(`/courses/${courseId}/topic-items/${topicItemId}/toggle-completion`);
        return response.data;
    },

    /**
     * Reorder topic items
     * @param {number} courseId
     * @param {Array} topicOrders
     * @returns {Promise<Object>}
     */
    async reorderTopicItems(courseId, topicOrders) {
        const response = await api.post(`/courses/${courseId}/topic-items/reorder`, {
            topic_orders: topicOrders
        });
        return response.data;
    },

    // Exam Management
    
    /**
     * Get exams for a course
     * @param {number} courseId
     * @returns {Promise<Object>}
     */
    async getExams(courseId) {
        const response = await api.get(`/courses/${courseId}/exams`);
        return response.data;
    },

    /**
     * Get a specific exam
     * @param {number} courseId
     * @param {number} examId
     * @returns {Promise<Object>}
     */
    async getExam(courseId, examId) {
        const response = await api.get(`/courses/${courseId}/exams/${examId}`);
        return response.data;
    },

    /**
     * Create a new exam
     * @param {number} courseId
     * @param {Object} examData
     * @returns {Promise<Object>}
     */
    async createExam(courseId, examData) {
        const response = await api.post(`/courses/${courseId}/exams`, examData);
        return response.data;
    },

    /**
     * Update an exam
     * @param {number} courseId
     * @param {number} examId
     * @param {Object} examData
     * @returns {Promise<Object>}
     */
    async updateExam(courseId, examId, examData) {
        const response = await api.put(`/courses/${courseId}/exams/${examId}`, examData);
        return response.data;
    },

    /**
     * Delete an exam
     * @param {number} courseId
     * @param {number} examId
     * @returns {Promise<void>}
     */
    async deleteExam(courseId, examId) {
        await api.delete(`/courses/${courseId}/exams/${examId}`);
    },

    /**
     * Get upcoming exams for a course
     * @param {number} courseId
     * @returns {Promise<Object>}
     */
    async getUpcomingExams(courseId) {
        const response = await api.get(`/courses/${courseId}/exams/upcoming`);
        return response.data;
    },

    /**
     * Update exam preparation status
     * @param {number} courseId
     * @param {number} examId
     * @param {Object} preparationStatus
     * @returns {Promise<Object>}
     */
    async updateExamPreparation(courseId, examId, preparationStatus) {
        const response = await api.post(`/courses/${courseId}/exams/${examId}/update_preparation`, {
            preparation_status: preparationStatus
        });
        return response.data;
    },

    /**
     * Generate study plan for an exam
     * @param {number} courseId
     * @param {number} examId
     * @returns {Promise<Object>}
     */
    async generateExamStudyPlan(courseId, examId) {
        const response = await api.post(`/courses/${courseId}/exams/${examId}/generate_study_plan`);
        return response.data;
    },

    /**
     * Get exam calendar events
     * @param {number} courseId
     * @returns {Promise<Array>}
     */
    async getExamCalendarEvents(courseId) {
        const response = await api.get(`/courses/${courseId}/exams/calendar_events`);
        return response.data;
    },

    // Calendar and Timeline Methods

    /**
     * Get all calendar events for a course (assignments + exams)
     * @param {number} courseId
     * @returns {Promise<Array>}
     */
    async getCalendarEvents(courseId) {
        const [assignments, examEvents] = await Promise.all([
            this.getAssignments(courseId),
            this.getExamCalendarEvents(courseId)
        ]);

        const assignmentEvents = (assignments.results || assignments || []).map(assignment => ({
            id: `assignment_${assignment.id}`,
            title: assignment.title,
            start: assignment.due_date,
            type: 'assignment',
            assignment_type: assignment.assignment_type,
            status: assignment.status,
            description: assignment.description
        }));

        return [...assignmentEvents, ...examEvents];
    },

    /**
     * Get all calendar events including study plan deadlines
     * @returns {Promise<Array>}
     */
    async getAllCalendarEvents() {
        try {
            // Get all courses
            const courses = await this.getCourses();
            const courseList = courses.results || courses || [];
            
            // Get course events
            let allEvents = [];
            for (const course of courseList) {
                try {
                    const courseEvents = await this.getCalendarEvents(course.id);
                    const eventsWithCourse = courseEvents.map(event => ({
                        ...event,
                        courseName: course.name,
                        courseId: course.id
                    }));
                    allEvents = [...allEvents, ...eventsWithCourse];
                } catch (err) {
                    console.error(`Error loading events for course ${course.id}:`, err);
                }
            }
            
            // Get study plan deadlines
            try {
                const studyPlanEvents = await this.getStudyPlanCalendarEvents();
                allEvents = [...allEvents, ...studyPlanEvents];
            } catch (err) {
                console.error('Error loading study plan events:', err);
            }
            
            return allEvents;
        } catch (err) {
            console.error('Error loading all calendar events:', err);
            throw err;
        }
    },

    /**
     * Get study plan deadlines formatted for calendar
     * @returns {Promise<Array>}
     */
    async getStudyPlanCalendarEvents() {
        const response = await api.get('/study-plans/calendar-events');
        return response.data;
    },
};
