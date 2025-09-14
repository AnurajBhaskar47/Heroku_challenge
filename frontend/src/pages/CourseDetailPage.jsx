import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
import { useCourses } from '../hooks/useCourses.jsx';
import { coursesService } from '../services/courses.js';
import { formatDate } from '../utils/formatters.js';
import { getErrorMessage } from '../services/api.js';
import CourseFormModal from '../components/courses/CourseFormModal.jsx';
import AssignmentFormModal from '../components/assignments/AssignmentFormModal.jsx';
import AssignmentCard from '../components/assignments/AssignmentCard.jsx';

/**
 * Course detail page component
 */
const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        updateCourse,
        deleteCourse,
        createAssignment,
        updateAssignment,
        deleteAssignment: deleteAssignmentFromHook
    } = useCourses();

    const [course, setCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Fetch course details and assignments
    const fetchCourseData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch course details
            const courseResponse = await coursesService.getCourse(id);
            setCourse(courseResponse);

            // Fetch assignments for this course
            const assignmentsResponse = await coursesService.getAssignments(id);
            setAssignments(assignmentsResponse.results || assignmentsResponse || []);

        } catch (err) {
            setError(getErrorMessage(err));
            if (err.response?.status === 404) {
                setCourse('not_found');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchCourseData();
        }
    }, [id, fetchCourseData]);

    const handleEditCourse = () => {
        setIsEditModalOpen(true);
    };

    const handleDeleteCourse = async () => {
        setIsSubmitting(true);
        const result = await deleteCourse(id);
        if (result.success) {
            navigate('/courses');
        } else {
            // TODO: show error toast
            setIsSubmitting(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const handleUpdateCourse = async (courseData) => {
        setIsSubmitting(true);
        try {
            const result = await updateCourse(parseInt(id), courseData);
            if (result.success) {
                setCourse(result.course);
                setIsEditModalOpen(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddAssignment = () => {
        setEditingAssignment(null);
        setIsAssignmentModalOpen(true);
    };

    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment);
        setIsAssignmentModalOpen(true);
    };

    const handleDeleteAssignment = async (assignment) => {
        const result = await deleteAssignmentFromHook(course.id, assignment.id);
        if (result.success) {
            fetchCourseData(); // Refetch all data
        }
        return result;
    };

    const handleUpdateAssignmentStatus = async (assignment, status) => {
        // Optimistically update the UI
        setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, status } : a));

        try {
            let updatedAssignment;
            if (status === 'in_progress') {
                updatedAssignment = await coursesService.markAssignmentInProgress(course.id, assignment.id);
            } else if (status === 'completed') {
                updatedAssignment = await coursesService.markAssignmentCompleted(course.id, assignment.id);
            } else {
                // For other status changes, use the generic update method
                const result = await updateAssignment(course.id, assignment.id, { status });
                updatedAssignment = result.assignment;
            }

            // Update with the actual response from the server
            setAssignments(prev => prev.map(a => a.id === assignment.id ? updatedAssignment : a));
        } catch (error) {
            // If the update fails, revert the change and show an error
            setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, status: assignment.status } : a));
            // TODO: Show a toast notification with the error
            console.error('Failed to update assignment status:', error);
        }
    };

    const handleSubmitAssignment = async (assignmentData) => {
        setIsSubmitting(true);
        try {
            let result;
            if (editingAssignment) {
                result = await updateAssignment(course.id, editingAssignment.id, assignmentData);
            } else {
                result = await createAssignment(course.id, assignmentData);
            }
            if (result.success) {
                setIsAssignmentModalOpen(false);
                fetchCourseData(); // Refetch all data
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 1: return 'Very Easy';
            case 2: return 'Easy';
            case 3: return 'Medium';
            case 4: return 'Hard';
            case 5: return 'Very Hard';
            default: return 'Unknown';
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 1: return 'bg-green-100 text-green-800';
            case 2: return 'bg-blue-100 text-blue-800';
            case 3: return 'bg-yellow-100 text-yellow-800';
            case 4: return 'bg-orange-100 text-orange-800';
            case 5: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate dynamic progress based on current assignments state
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const progressPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error || course === 'not_found') {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {error || "The course you're looking for doesn't exist or has been removed."}
                    </p>
                    <Button onClick={() => navigate('/courses')}>
                        Back to Courses
                    </Button>
                </div>
            </div>
        );
    }

    // Show loading state while course is being fetched
    if (isLoading || !course) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/courses')}
                            className="p-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
                        {course.code && (
                            <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                                {course.code}
                            </span>
                        )}
                    </div>
                    {course.description && (
                        <p className="text-gray-600 max-w-2xl">{course.description}</p>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleEditCourse}>
                        Edit Course
                    </Button>
                    <Button variant="danger" onClick={() => setIsDeleteConfirmOpen(true)}>Delete Course</Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Course Information */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Information</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Basic Info */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Details</h4>
                                    <div className="space-y-2">
                                        {course.instructor && (
                                            <div className="flex items-center text-sm">
                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="text-gray-600">Instructor:</span>
                                                <span className="ml-1 font-medium">{course.instructor}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center text-sm">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            <span className="text-gray-600">Credits:</span>
                                            <span className="ml-1 font-medium">{course.credits || 0}</span>
                                        </div>

                                        {course.semester && (
                                            <div className="flex items-center text-sm">
                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-gray-600">Semester:</span>
                                                <span className="ml-1 font-medium">{course.semester}</span>
                                            </div>
                                        )}

                                        {course.difficulty_level && (
                                            <div className="flex items-center text-sm">
                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span className="text-gray-600">Difficulty:</span>
                                                <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                                                    {getDifficultyLabel(course.difficulty_level)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Schedule Info */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule</h4>
                                    <div className="space-y-2">
                                        {course.start_date && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-600">Start Date:</span>
                                                <span className="ml-1 font-medium">{formatDate(course.start_date)}</span>
                                            </div>
                                        )}

                                        {course.end_date && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-600">End Date:</span>
                                                <span className="ml-1 font-medium">{formatDate(course.end_date)}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Syllabus */}
                            {course.syllabus_text && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Syllabus</h4>
                                    <div className="bg-gray-50 p-4 rounded-md">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{course.syllabus_text}</p>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Course Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Progress Overview</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{totalAssignments}</div>
                                    <div className="text-sm text-gray-600">Total Assignments</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{completedAssignments}</div>
                                    <div className="text-sm text-gray-600">Completed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
                                    <div className="text-sm text-gray-600">Progress</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Assignments Sidebar */}
                <div>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Assignments</CardTitle>
                                <Button size="sm" onClick={handleAddAssignment}>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {assignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    <p className="text-gray-600 text-sm mb-4">
                                        No assignments yet. Create your first assignment to get started.
                                    </p>
                                    <Button size="sm" onClick={handleAddAssignment} fullWidth>
                                        Create Assignment
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {assignments.map((assignment) => (
                                        <AssignmentCard
                                            key={assignment.id}
                                            assignment={assignment}
                                            onEdit={handleEditAssignment}
                                            onDelete={handleDeleteAssignment}
                                            onUpdateStatus={handleUpdateAssignmentStatus}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Edit Course Modal */}
            <CourseFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateCourse}
                course={course}
                isSubmitting={isSubmitting}
            />

            <AssignmentFormModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                onSubmit={handleSubmitAssignment}
                assignment={editingAssignment}
                isSubmitting={isSubmitting}
            />

            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDeleteCourse}
                title="Delete Course"
                message={`Are you sure you want to delete "${course.name}"? This will also delete all associated assignments.`}
                confirmText="Delete"
                isConfirming={isSubmitting}
            />
        </div>
    );
};

export default CourseDetailPage;
