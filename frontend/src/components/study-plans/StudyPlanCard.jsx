import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import DropdownMenu from '../common/DropdownMenu.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';

/**
 * StudyPlanCard component for displaying individual study plans
 */
const StudyPlanCard = ({
    studyPlan,
    onEdit,
    onDelete,
    onView,
    onActivate,
    onPause,
    onComplete,
    onDuplicate,
    onUpdateProgress,
    onSetDraft,
    onSetActive,
    className = '',
}) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    // Get status badge styling
    const getStatusBadge = (status) => {
        const statusMap = {
            draft: 'bg-gray-100 text-gray-800',
            active: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            paused: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
        };

        return statusMap[status] || 'bg-gray-100 text-gray-800';
    };


    // Handle delete confirmation
    const handleDelete = async () => {
        try {
            await onDelete(studyPlan.id);
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Failed to delete study plan:', error);
        }
    };

    // Dropdown menu items
    const dropdownItems = [
        { 
            label: 'View', 
            onClick: () => onView(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )
        },
    ];

    // Add Edit button only if not completed
    if (studyPlan.status !== 'completed') {
        dropdownItems.push({ 
            label: 'Edit', 
            onClick: () => onEdit(studyPlan), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        });
    }

    // Always add duplicate option
    dropdownItems.push(
        { 
            label: 'Duplicate', 
            onClick: () => onDuplicate(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        { type: 'divider' }
    );

    // Add status-specific actions
    if (studyPlan.status === 'draft') {
        dropdownItems.push({ 
            label: 'Activate', 
            onClick: () => onActivate(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8M7 9h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
            )
        });
    } else if (studyPlan.status === 'active') {
        dropdownItems.push({ 
            label: 'Pause', 
            onClick: () => onPause(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        });
        dropdownItems.push({ 
            label: 'Mark Complete', 
            onClick: () => onComplete(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        });
    } else if (studyPlan.status === 'paused') {
        dropdownItems.push({ 
            label: 'Reactivate', 
            onClick: () => onActivate(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8M7 9h10a2 2 0 012 2v8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
            )
        });
    } else if (studyPlan.status === 'completed') {
        dropdownItems.push({ 
            label: 'Set to Draft', 
            onClick: () => onSetDraft(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            )
        });
        dropdownItems.push({ 
            label: 'Set to Active', 
            onClick: () => onSetActive(studyPlan.id), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8M7 9h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
            )
        });
    }

    dropdownItems.push(
        { type: 'divider' },
        { 
            label: 'Delete', 
            onClick: () => setShowDeleteModal(true), 
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            className: 'text-red-600 hover:text-red-700' 
        }
    );

    return (
        <>
            <Card 
                hover 
                className={`transition-all duration-200 cursor-pointer ${className}`}
                onClick={() => onView(studyPlan.id)}
            >
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="mb-2">{studyPlan.title}</CardTitle>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(studyPlan.status)}`}>
                                    {studyPlan.status.charAt(0).toUpperCase() + studyPlan.status.slice(1)}
                                </span>
                                {studyPlan.course_info && (
                                    <span className="text-xs text-gray-500">
                                        {studyPlan.course_info.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <DropdownMenu items={dropdownItems} />
                    </div>
                </CardHeader>

                <CardBody>
                    {/* Description */}
                    {studyPlan.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {studyPlan.description}
                        </p>
                    )}

                    {/* Progress Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{Math.round(studyPlan.progress_percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    studyPlan.progress_percentage === 100
                                        ? 'bg-green-500'
                                        : studyPlan.is_overdue
                                        ? 'bg-red-500'
                                        : 'bg-blue-500'
                                }`}
                                style={{ width: `${studyPlan.progress_percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
                        <div>
                            <span className="block">Start Date</span>
                            <span className="font-medium text-gray-700">
                                {formatDate(studyPlan.start_date)}
                            </span>
                        </div>
                        <div>
                            <span className="block">End Date</span>
                            <span className={`font-medium ${studyPlan.is_overdue ? 'text-red-600' : 'text-gray-700'}`}>
                                {formatDate(studyPlan.end_date)}
                            </span>
                        </div>
                    </div>

                    {/* Timeline Progress */}
                    {studyPlan.days_remaining !== null && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Time Progress</span>
                                <span>
                                    {studyPlan.days_remaining > 0
                                        ? `${studyPlan.days_remaining} days left`
                                        : studyPlan.days_remaining === 0
                                        ? 'Due today'
                                        : 'Overdue'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        studyPlan.is_overdue ? 'bg-red-400' : 'bg-gray-400'
                                    }`}
                                    style={{ width: `${Math.min(100, studyPlan.time_progress_percentage || 0)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Plan Summary */}
                    {studyPlan.plan_summary && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            {studyPlan.plan_summary.total_topics > 0 && (
                                <span>{studyPlan.plan_summary.total_topics} topics</span>
                            )}
                            {studyPlan.plan_summary.estimated_hours > 0 && (
                                <span>{studyPlan.plan_summary.estimated_hours}h estimated</span>
                            )}
                            {studyPlan.plan_summary.total_milestones > 0 && (
                                <span>{studyPlan.plan_summary.total_milestones} milestones</span>
                            )}
                            {studyPlan.plan_summary.difficulty_level && (
                                <span>
                                    Difficulty: {
                                        studyPlan.plan_summary.difficulty_level === 1 ? 'Very Easy' :
                                        studyPlan.plan_summary.difficulty_level === 2 ? 'Easy' :
                                        studyPlan.plan_summary.difficulty_level === 3 ? 'Medium' :
                                        studyPlan.plan_summary.difficulty_level === 4 ? 'Hard' :
                                        'Very Hard'
                                    }
                                </span>
                            )}
                        </div>
                    )}

                    {/* Overdue Warning */}
                    {studyPlan.is_overdue && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-red-700 text-sm font-medium">
                                    This study plan is overdue
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions for Active Plans */}
                    {studyPlan.status === 'active' && (
                        <div className="flex gap-2 mt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView(studyPlan.id);
                                }}
                                className="flex-1"
                            >
                                View Details
                            </Button>
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(studyPlan);
                                }}
                                className="flex-1"
                            >
                                Edit Plan
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Study Plan"
                message={
                    <>
                        Are you sure you want to delete <strong>{studyPlan.title}</strong>?
                        <br />
                        <span className="text-sm text-gray-500">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Delete"
                confirmVariant="danger"
            />
        </>
    );
};

export default StudyPlanCard;
