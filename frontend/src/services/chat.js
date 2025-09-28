import api from './api.js';

/**
 * Chat service for AI assistant communication
 */
export const chatService = {
    /**
     * Send a message to the AI assistant with course context
     * @param {string} message - User message
     * @param {number} courseId - Course ID for context
     * @param {Object} additionalContext - Additional context data
     * @returns {Promise<Object>} AI response
     */
    async sendMessage(message, courseId = null, additionalContext = {}) {
        const requestData = {
            message,
            context: {
                ...additionalContext,
                timestamp: new Date().toISOString()
            }
        };

        // Add course_id if provided
        if (courseId) {
            requestData.course_id = courseId;
        }

        const response = await api.post('/ai-assistant/chat/', requestData);
        return response.data;
    },

    /**
     * Get course context data for enhanced AI responses
     * @param {number} courseId - Course ID
     * @returns {Promise<Object>} Course context data
     */
    async getCourseContext(courseId) {
        try {
            // Fetch all course-related data in parallel
            const [
                courseResponse,
                topicsResponse,
                assignmentsResponse,
                quizFilesResponse,
                resourcesResponse,
                topicItemsResponse
            ] = await Promise.all([
                api.get(`/courses/${courseId}/`),
                api.get(`/courses/${courseId}/topics/`),
                api.get(`/courses/${courseId}/assignments/`),
                api.get(`/courses/${courseId}/quiz-files/`),
                api.get(`/resources/?course_id=${courseId}`),
                api.get(`/courses/${courseId}/topic-items/`)
            ]);

            const course = courseResponse.data;
            const topics = topicsResponse.data.results || topicsResponse.data || [];
            const assignments = assignmentsResponse.data.results || assignmentsResponse.data || [];
            const quizFiles = quizFilesResponse.data.results || quizFilesResponse.data || [];
            const resources = resourcesResponse.data.results || resourcesResponse.data || [];
            const topicItems = topicItemsResponse.data.results || topicItemsResponse.data || [];

            return {
                course: {
                    id: course.id,
                    name: course.name,
                    code: course.code,
                    description: course.description,
                    instructor: course.instructor,
                    difficulty_level: course.difficulty_level,
                    credits: course.credits,
                    semester: course.semester,
                    start_date: course.start_date,
                    end_date: course.end_date,
                    is_active: course.is_active
                },
                topics: topics.map(topic => ({
                    id: topic.id,
                    content_source: topic.content_source,
                    has_content: topic.has_content,
                    topic_count: topic.topic_count,
                    topics_summary: topic.topics_summary,
                    is_processed: topic.is_processed
                })),
                topic_items: topicItems.map(item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    difficulty: item.difficulty,
                    is_completed: item.is_completed
                })),
                assignments: assignments.map(assignment => ({
                    id: assignment.id,
                    title: assignment.title,
                    description: assignment.description,
                    assignment_type: assignment.assignment_type,
                    due_date: assignment.due_date,
                    status: assignment.status,
                    estimated_hours: assignment.estimated_hours,
                    weight: assignment.weight
                })),
                quiz_files: quizFiles.map(quiz => ({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    file_type: quiz.file_type,
                    is_processed: quiz.is_processed
                })),
                resources: resources.map(resource => ({
                    id: resource.id,
                    title: resource.title,
                    description: resource.description,
                    resource_type: resource.resource_type,
                    tags: resource.tags
                })),
                progress: {
                    completed_assignments: assignments.filter(a => a.status === 'completed').length,
                    total_assignments: assignments.length,
                    completed_topics: topicItems.filter(t => t.is_completed).length,
                    total_topics: topicItems.length
                }
            };
        } catch (error) {
            console.error('Error fetching course context:', error);
            return null;
        }
    },

    /**
     * Send message with enhanced course context
     * @param {string} message - User message
     * @param {number} courseId - Course ID
     * @returns {Promise<Object>} AI response with context
     */
    async sendMessageWithContext(message, courseId) {
        try {
            // Get comprehensive course context
            const courseContext = await this.getCourseContext(courseId);
            
            // Send message with full context
            return await this.sendMessage(message, courseId, {
                course_context: courseContext,
                enhanced_context: true
            });
        } catch (error) {
            console.error('Error sending message with context:', error);
            // Fallback to basic message without context
            return await this.sendMessage(message, courseId);
        }
    }
};
