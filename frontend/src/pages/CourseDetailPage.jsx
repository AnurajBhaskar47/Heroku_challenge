import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardBody } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
import { useCourses } from '../hooks/useCourses.jsx';
import { coursesService } from '../services/courses.js';
import { formatDate } from '../utils/formatters.js';
import { getErrorMessage } from '../services/api.js';
import CourseFormModal from '../components/courses/CourseFormModal.jsx';
import QuizFileSection from '../components/courses/QuizFileSection.jsx';
import AssignmentsSection from '../components/courses/AssignmentsSection.jsx';
import TopicsSection from '../components/courses/TopicsSection.jsx';

/**
 * Course detail page component
 */
const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        updateCourse,
        deleteCourse
    } = useCourses();

    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Fetch course details
    const fetchCourseData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch course details
            const courseResponse = await coursesService.getCourse(id);
            setCourse(courseResponse);

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

    // Course statistics (these will be handled by integrated AssignmentsSection)

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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course details...</p>
                </div>
            </div>
        );
    }

    // Show not found state
    if (course === 'not_found') {
        return (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
                    <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
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

            {/* Top Section: Course Information + Course Overview with Course Topics Sidebar */}
            <div className="grid gap-6 lg:grid-cols-10 mb-6">
                {/* Left Content - Course Information + Course Overview (70%) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Course Information */}
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
                                            <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Course Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Overview</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-2 gap-12">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{course.credits}</div>
                                    <div className="text-sm text-gray-600">Credits</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{getDifficultyLabel(course.difficulty_level)}</div>
                                    <div className="text-sm text-gray-600">Difficulty</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${course.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                                        {course.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                    <div className="text-sm text-gray-600">Status</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Course Topics Sidebar - spans height of Course Information + Course Overview (30%) */}
                <div className="lg:col-span-3">
                    <div className="lg:sticky lg:top-6">
                        <TopicsSection courseId={id} />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Quiz Files and Assignments - Full Width 50% each */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Quiz Files - 50% of full width */}
                <div className="w-full">
                    <QuizFileSection courseId={id} />
                </div>

                {/* Assignments - 50% of full width */}
                <div className="w-full">
                    <AssignmentsSection 
                        courseId={id} 
                        onUpdateAssignmentStatus={fetchCourseData} 
                    />
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