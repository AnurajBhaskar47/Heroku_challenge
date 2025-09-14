import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import DropdownMenu from '../common/DropdownMenu.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import { formatDate } from '../../utils/formatters.js';

/**
 * Course card component
 */
const CourseCard = ({ course, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const handleViewCourse = () => {
        navigate(`/courses/${course.id}`);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        console.log('Edit clicked for course:', course.name);
        onEdit(course);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        console.log('Delete clicked for course:', course.name);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        const result = await onDelete(course.id);
        if (!result.success) {
            setIsDeleting(false);
        }
        setIsDeleteConfirmOpen(false);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 1:
                return 'bg-green-100 text-green-800';
            case 2:
                return 'bg-blue-100 text-blue-800';
            case 3:
                return 'bg-yellow-100 text-yellow-800';
            case 4:
                return 'bg-orange-100 text-orange-800';
            case 5:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 1:
                return 'Very Easy';
            case 2:
                return 'Easy';
            case 3:
                return 'Medium';
            case 4:
                return 'Hard';
            case 5:
                return 'Very Hard';
            default:
                return 'Unknown';
        }
    };

    const menuItems = [
        {
            label: 'View Details',
            onClick: handleViewCourse,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
        },
        {
            label: 'Edit',
            onClick: handleEdit,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        {
            label: 'Delete',
            onClick: handleDelete,
            className: 'text-red-600 hover:text-red-800',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
        },
    ];

    if (isDeleting) {
        return (
            <Card>
                <CardBody>
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Deleting...</span>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card hover clickable onClick={handleViewCourse} className="group">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="truncate group-hover:text-primary-600 transition-colors">
                                {course.name}
                            </CardTitle>
                            {course.code && (
                                <p className="text-sm text-gray-500 font-medium">{course.code}</p>
                            )}
                        </div>
                        <DropdownMenu
                            items={menuItems}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </div>
                </CardHeader>

                <CardBody>
                    {course.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {course.description}
                        </p>
                    )}

                    <div className="space-y-3">
                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-500">
                                    <span className="font-medium">{course.credits || 0}</span> credits
                                </span>
                                {course.semester && (
                                    <span className="text-gray-500">{course.semester}</span>
                                )}
                            </div>

                            {course.difficulty_level && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                                    {getDifficultyLabel(course.difficulty_level)}
                                </span>
                            )}
                        </div>

                        {/* Instructor */}
                        {course.instructor && (
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{course.instructor}</span>
                            </div>
                        )}

                        {/* Dates */}
                        {(course.start_date || course.end_date) && (
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>
                                    {course.start_date && formatDate(course.start_date)}
                                    {course.start_date && course.end_date && ' - '}
                                    {course.end_date && formatDate(course.end_date)}
                                </span>
                            </div>
                        )}

                        {/* Assignment Stats (if available) */}
                        {course.assignment_count !== undefined && (
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span>
                                    {course.assignment_count} assignment{course.assignment_count !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Course"
                message={`Are you sure you want to delete "${course.name}"? This will also delete all associated assignments.`}
                confirmText="Delete"
                isConfirming={isDeleting}
            />
        </>
    );
};

export default CourseCard;
