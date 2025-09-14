import { useState, useEffect } from 'react';
import { coursesService } from '../services/courses.js';
import { getErrorMessage } from '../services/api.js';

/**
 * Hook for managing courses state and operations
 */
export const useCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch all courses
     */
    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await coursesService.getCourses();
            setCourses(data.results || data); // Handle paginated or direct array response
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create a new course
     * @param {Object} courseData
     * @returns {Promise<{success: boolean, course?: Object, error?: string}>}
     */
    const createCourse = async (courseData) => {
        try {
            setError(null);
            const newCourse = await coursesService.createCourse(courseData);
            setCourses(prev => [newCourse, ...prev]);
            return { success: true, course: newCourse };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    /**
     * Update an existing course
     * @param {number} courseId
     * @param {Object} courseData
     * @returns {Promise<{success: boolean, course?: Object, error?: string}>}
     */
    const updateCourse = async (courseId, courseData) => {
        try {
            setError(null);
            const updatedCourse = await coursesService.updateCourse(courseId, courseData);
            setCourses(prev => prev.map(course =>
                course.id === courseId ? updatedCourse : course
            ));
            return { success: true, course: updatedCourse };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    /**
     * Delete a course
     * @param {number} courseId
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const deleteCourse = async (courseId) => {
        try {
            setError(null);
            await coursesService.deleteCourse(courseId);
            setCourses(prev => prev.filter(course => course.id !== courseId));
            return { success: true };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    /**
     * Get a single course by ID
     * @param {number} courseId
     * @returns {Promise<{success: boolean, course?: Object, error?: string}>}
     */
    const getCourse = async (courseId) => {
        try {
            setError(null);
            const course = await coursesService.getCourse(courseId);
            return { success: true, course };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    /**
     * Create a new assignment for a course
     * @param {number} courseId
     * @param {Object} assignmentData
     * @returns {Promise<{success: boolean, assignment?: Object, error?: string}>}
     */
    const createAssignment = async (courseId, assignmentData) => {
        try {
            setError(null);
            const newAssignment = await coursesService.createAssignment(courseId, assignmentData);
            // Optionally, update course details here if assignment count is tracked
            return { success: true, assignment: newAssignment };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    /**
     * Update an existing assignment
     * @param {number} courseId
     * @param {number} assignmentId
     * @param {Object} assignmentData
     * @returns {Promise<{success: boolean, assignment?: Object, error?: string}>}
     */
    const updateAssignment = async (courseId, assignmentId, assignmentData) => {
        try {
            setError(null);
            const updatedAssignment = await coursesService.updateAssignment(courseId, assignmentId, assignmentData);
            return { success: true, assignment: updatedAssignment };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    /**
     * Delete an assignment
     * @param {number} courseId
     * @param {number} assignmentId
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const deleteAssignment = async (courseId, assignmentId) => {
        try {
            setError(null);
            await coursesService.deleteAssignment(courseId, assignmentId);
            return { success: true };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    // Auto-fetch courses on mount
    useEffect(() => {
        fetchCourses();
    }, []);

    return {
        courses,
        loading,
        error,
        fetchCourses,
        createCourse,
        updateCourse,
        deleteCourse,
        getCourse,
        createAssignment,
        updateAssignment,
        deleteAssignment,
    };
};
