import { useState } from 'react';
import Button from '../components/common/Button.jsx';
import { EmptyCoursesState } from '../components/common/EmptyState.jsx';
import { useCourses } from '../hooks/useCourses.jsx';
import CourseCard from '../components/courses/CourseCard.jsx';
import CourseFormModal from '../components/courses/CourseFormModal.jsx';

/**
 * Courses page component
 */
const CoursesPage = () => {
    const { courses, loading, error, createCourse, updateCourse, deleteCourse } = useCourses();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddCourse = () => {
        setEditingCourse(null);
        setIsModalOpen(true);
    };

    const handleEditCourse = (course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleDeleteCourse = async (courseId) => {
        return await deleteCourse(courseId);
    };

    const handleSubmitCourse = async (courseData) => {
        setIsSubmitting(true);
        try {
            let result;
            if (editingCourse) {
                result = await updateCourse(editingCourse.id, courseData);
            } else {
                result = await createCourse(courseData);
            }

            if (result.success) {
                setIsModalOpen(false);
                setEditingCourse(null);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setIsModalOpen(false);
            setEditingCourse(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                        <p className="text-gray-600">Manage your courses and track assignments</p>
                    </div>
                </div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                        <p className="text-gray-600">Manage your courses and track assignments</p>
                    </div>
                    <Button onClick={handleAddCourse}>Add Course</Button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading courses</h3>
                            <p className="mt-1 text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                        <p className="text-gray-600">Manage your courses and track assignments</p>
                    </div>
                    <Button onClick={handleAddCourse}>Add Course</Button>
                </div>
                <EmptyCoursesState onAddCourse={handleAddCourse} />

                <CourseFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitCourse}
                    course={editingCourse}
                    isSubmitting={isSubmitting}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                    <p className="text-gray-600">
                        Manage your {courses.length} course{courses.length !== 1 ? 's' : ''} and track assignments
                    </p>
                </div>
                <Button onClick={handleAddCourse}>Add Course</Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        onEdit={handleEditCourse}
                        onDelete={handleDeleteCourse}
                    />
                ))}
            </div>

            <CourseFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitCourse}
                course={editingCourse}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default CoursesPage;
