import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import DropdownMenu from '../common/DropdownMenu';
import ExamTimeline from './ExamTimeline';
import { coursesService } from '../../services/courses';

/**
 * Progress Tracker component for displaying course progress and syllabus sources
 */
const ProgressTracker = ({ courseId }) => {
    const [assignments, setAssignments] = useState([]);
    const [topicItems, setTopicItems] = useState([]);
    const [courseTopics, setCourseTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, topic: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (courseId) {
            loadProgressData();
        }
    }, [courseId]);

    const loadProgressData = async () => {
        try {
            setLoading(true);
            const [assignmentsData, topicItemsData, courseTopicsData] = await Promise.all([
                coursesService.getAssignments(courseId),
                coursesService.getCourseTopicItems(courseId),
                coursesService.getCourseTopics(courseId)
            ]);

            setAssignments(assignmentsData.results || assignmentsData || []);
            setTopicItems(topicItemsData.results || topicItemsData || []);
            setCourseTopics(courseTopicsData.results || courseTopicsData || []);
        } catch (error) {
            console.error('Error loading progress data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate progress
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const totalAssignments = assignments.length;
    const completedTopics = topicItems.filter(t => t.is_completed).length;
    const totalTopics = topicItems.length;

    // Calculate overall progress percentage
    const totalItems = totalAssignments + totalTopics;
    const completedItems = completedAssignments + completedTopics;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Handle syllabus viewing
    const handleViewSyllabus = (topic) => {
        if (topic.content_source === 'file' && topic.syllabus_file_url) {
            // Open file in new tab
            window.open(topic.syllabus_file_url, '_blank');
        } else if (topic.syllabus_text) {
            // Show text content in alert (you can replace this with a modal)
            alert(`Syllabus Content:\n\n${topic.syllabus_text}`);
        } else {
            alert('No syllabus content available to view.');
        }
    };

    const handleDeleteSyllabus = async () => {
        if (!deleteConfirm.topic) return;

        try {
            setIsSubmitting(true);
            await coursesService.deleteCourseTopics(courseId, deleteConfirm.topic.id);
            
            setDeleteConfirm({ isOpen: false, topic: null });
            // Reload the data after successful deletion
            loadProgressData();
        } catch (error) {
            console.error('Error deleting syllabus:', error);
            alert('Failed to delete syllabus. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Progress Tracker</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="text-center py-4">Loading progress...</div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="min-h-[280px] sm:min-h-[320px] lg:min-h-[345px] flex flex-col">
            <CardHeader>
                <CardTitle>Progress Tracker</CardTitle>
            </CardHeader>
            <CardBody className="flex-1">
                <div className="grid gap-4 lg:gap-6 lg:grid-cols-3 h-full">
                    {/* Left Section - Progress Circle and Stats */}
                    <div className="space-y-4 lg:space-y-6">
                        <h4 className="text-sm font-medium text-gray-900">Overall Progress</h4>
                        
                        {/* Progress Circle and Stats - Responsive Layout */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center sm:justify-start lg:justify-center gap-4 sm:gap-6 lg:gap-4">
                            {/* Progress Circle - Responsive Size */}
                            <div className="flex-shrink-0">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-20 lg:h-20">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        {/* Background circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-gray-200"
                                        />
                                        {/* Progress circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${progressPercentage * 2.83} 283`}
                                            className="text-blue-600 transition-all duration-300"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900">{progressPercentage}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Progress Stats - Responsive Layout */}
                            <div className="flex sm:flex-col lg:flex-row gap-4 sm:gap-4 lg:gap-6">
                                <div className="text-center sm:text-left lg:text-center">
                                    <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900">
                                        {completedTopics} / {totalTopics}
                                    </div>
                                    <div className="text-xs sm:text-sm lg:text-xs text-gray-600 mt-1">Topics</div>
                                </div>
                                <div className="text-center sm:text-left lg:text-center">
                                    <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900">
                                        {completedAssignments} / {totalAssignments}
                                    </div>
                                    <div className="text-xs sm:text-sm lg:text-xs text-gray-600 mt-1">Assignments</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section - Exam Timeline */}
                    <div className="space-y-2 lg:border-l lg:border-gray-200 lg:pl-4 pt-4 lg:pt-0">
                        <ExamTimeline courseId={courseId} />
                    </div>

                    {/* Right Section - Syllabus Sources */}
                    <div className="space-y-2 lg:border-l lg:border-gray-200 lg:pl-4 pt-4 lg:pt-0">
                        <h4 className="text-sm font-medium text-gray-900">Syllabus Sources</h4>
                        {courseTopics.length > 0 ? (
                            <div className="space-y-2">
                                {courseTopics.map((topic) => {
                                    // Create dropdown menu items for each syllabus source
                                    const menuItems = [
                                        {
                                            label: 'View',
                                            icon: (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            ),
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                handleViewSyllabus(topic);
                                            }
                                        },
                                        {
                                            label: 'Delete',
                                            icon: (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            ),
                                            className: 'text-red-700 hover:bg-red-50 hover:text-red-900',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm({ isOpen: true, topic });
                                            }
                                        }
                                    ];

                                    return (
                                        <div key={topic.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded p-2">
                                            <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                                                {topic.content_source === 'file' ? (
                                                    <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet">
                                                        <path d="M21.89,4H7.83A1.88,1.88,0,0,0,6,5.91V30.09A1.88,1.88,0,0,0,7.83,32H28.17A1.88,1.88,0,0,0,30,30.09V11.92Zm-.3,2.49,6,5.9h-6ZM8,30V6H20v8h8V30Z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="-2.5 -2.5 24 24" preserveAspectRatio="xMinYMin">
                                                        <path d='M12.238 5.472L3.2 14.51l-.591 2.016 1.975-.571 9.068-9.068-1.414-1.415zM13.78 3.93l1.414 1.414 1.318-1.318a.5.5 0 0 0 0-.707l-.708-.707a.5.5 0 0 0-.707 0L13.781 3.93zm3.439-2.732l.707.707a2.5 2.5 0 0 1 0 3.535L5.634 17.733l-4.22 1.22a1 1 0 0 1-1.237-1.241l1.248-4.255 12.26-12.26a2.5 2.5 0 0 1 3.535 0z'/>
                                                    </svg>
                                                )}
                                                <span className="truncate text-xs leading-tight">
                                                    {topic.content_source === 'file' 
                                                        ? (topic.syllabus_file_url?.split('/').pop() || 'Syllabus File')
                                                        : `Text (${topic.syllabus_text?.length || 0} chars)`
                                                    }
                                                </span>
                                            </div>
                                            
                                            {/* Dropdown menu */}
                                            <DropdownMenu
                                                items={menuItems}
                                                className="flex-shrink-0"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">No syllabus content added yet</p>
                        )}
                    </div>
                </div>
            </CardBody>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, topic: null })}
                onConfirm={handleDeleteSyllabus}
                title="Delete Syllabus Content"
                message={`Are you sure you want to delete this syllabus content? This will also delete all extracted topics. This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
                isConfirming={isSubmitting}
            />
        </Card>
    );
};

export default ProgressTracker;
