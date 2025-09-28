import api from './api.js';

/**
 * Dashboard service
 * @typedef {Object} DashboardStats
 * @property {number} total_courses
 * @property {number} pending_assignments
 * @property {number} total_study_plans
 * @property {number} study_streak_days
 */

/**
 * @typedef {Object} UpcomingAssignment
 * @property {number} id
 * @property {string} title
 * @property {string} due_date
 * @property {string} course_name
 * @property {number} course_id
 * @property {number} days_until_due
 */

/**
 * @typedef {Object} RecentCourse
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {string} updated_at
 * @property {number} progress_percentage
 */

/**
 * @typedef {Object} UpcomingExam
 * @property {number} id
 * @property {string} name
 * @property {string} exam_date
 * @property {string} exam_type
 * @property {string} exam_type_display
 * @property {string} course_name
 * @property {number} course_id
 * @property {number} days_until_exam
 * @property {string} location
 * @property {number} duration_minutes
 * @property {number} preparation_percentage
 */

/**
 * @typedef {Object} UpcomingStudyPlanDeadline
 * @property {number} id
 * @property {string} title
 * @property {string} end_date
 * @property {string} status
 * @property {number} progress_percentage
 * @property {number} days_until_deadline
 */

/**
 * @typedef {Object} DashboardData
 * @property {DashboardStats} stats
 * @property {UpcomingAssignment[]} upcoming_assignments
 * @property {UpcomingExam[]} upcoming_exams
 * @property {UpcomingStudyPlanDeadline[]} upcoming_study_plan_deadlines
 * @property {RecentCourse[]} recent_courses
 */

export const dashboardService = {
    /**
     * Get all dashboard data
     * @returns {Promise<DashboardData>}
     */
    async getDashboardData() {
        const response = await api.get('/dashboard/');
        return response.data;
    },
};
