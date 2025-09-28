import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card';
import Button from '../common/Button';
import { coursesService } from '../../services/courses';

/**
 * Progress Tracker component for displaying course progress and syllabus sources
 */
const ProgressTracker = ({ courseId }) => {
    const [assignments, setAssignments] = useState([]);
    const [topicItems, setTopicItems] = useState([]);
    const [courseTopics, setCourseTopics] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Handle syllabus editing
    const handleEditSyllabus = (topic) => {
        // This will be handled by the parent component or a modal
        console.log('Edit syllabus:', topic);
    };

    const handleDeleteSyllabus = (topic) => {
        // This will be handled by the parent component or a modal
        console.log('Delete syllabus:', topic);
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
        <Card>
            <CardHeader>
                <CardTitle>Progress Tracker</CardTitle>
            </CardHeader>
            <CardBody>
                <div className="flex items-center space-x-6">
                    {/* Progress Circle */}
                    <div className="flex-shrink-0">
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
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
                                <span className="text-lg font-bold text-gray-900">{progressPercentage}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Assignments</span>
                            <span className="text-sm font-medium text-gray-900">
                                {completedAssignments}/{totalAssignments}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Topics</span>
                            <span className="text-sm font-medium text-gray-900">
                                {completedTopics}/{totalTopics}
                            </span>
                        </div>
                    </div>

                    {/* Syllabus Sources */}
                    <div className="flex-1 border-l border-gray-200 pl-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Syllabus Sources</h4>
                        {courseTopics.length > 0 ? (
                            <div className="space-y-2">
                                {courseTopics.map((topic) => (
                                    <div key={topic.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded p-2">
                                        <div className="flex items-center space-x-2">
                                            {topic.content_source === 'file' ? (
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet">
                                                    <path d="M21.89,4H7.83A1.88,1.88,0,0,0,6,5.91V30.09A1.88,1.88,0,0,0,7.83,32H28.17A1.88,1.88,0,0,0,30,30.09V11.92Zm-.3,2.49,6,5.9h-6ZM8,30V6H20v8h8V30Z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="-2.5 -2.5 24 24" preserveAspectRatio="xMinYMin">
                                                    <path d='M12.238 5.472L3.2 14.51l-.591 2.016 1.975-.571 9.068-9.068-1.414-1.415zM13.78 3.93l1.414 1.414 1.318-1.318a.5.5 0 0 0 0-.707l-.708-.707a.5.5 0 0 0-.707 0L13.781 3.93zm3.439-2.732l.707.707a2.5 2.5 0 0 1 0 3.535L5.634 17.733l-4.22 1.22a1 1 0 0 1-1.237-1.241l1.248-4.255 12.26-12.26a2.5 2.5 0 0 1 3.535 0z'/>
                                                </svg>
                                            )}
                                            <span className="truncate">
                                                {topic.content_source === 'file' 
                                                    ? (topic.syllabus_file_url?.split('/').pop() || 'Syllabus File')
                                                    : `Text Content (${topic.syllabus_text?.length || 0} chars)`
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditSyllabus(topic)}
                                                title="Edit syllabus"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteSyllabus(topic)}
                                                title="Delete syllabus"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">No syllabus content added yet</p>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default ProgressTracker;
