import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { plansService } from '../../services/plans.js';

/**
 * StudyPlanDetailModal component for viewing detailed study plan information
 */
const StudyPlanDetailModal = ({
    isOpen,
    onClose,
    studyPlanId,
    onEdit,
    onDelete,
    onUpdateProgress,
    onActivate,
    onPause,
    onComplete,
    onSetDraft,
    onSetActive,
    onTopicUpdate,
}) => {
    const [studyPlan, setStudyPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completedTopics, setCompletedTopics] = useState(new Set());
    const [completedMilestones, setCompletedMilestones] = useState(new Set());

    // Load study plan details
    useEffect(() => {
        if (isOpen && studyPlanId) {
            loadStudyPlan();
        }
    }, [isOpen, studyPlanId]);

    const loadStudyPlan = async () => {
        try {
            setLoading(true);
            setError(null);
            const plan = await plansService.getPlan(studyPlanId);
            setStudyPlan(plan);
            
            // Initialize completed items
            if (plan.plan_data) {
                const completedTopicIds = new Set(
                    plan.plan_data.topics?.filter(t => t.completed).map(t => t.id) || []
                );
                const completedMilestoneIds = new Set(
                    plan.plan_data.milestones?.filter(m => m.completed).map(m => m.id) || []
                );
                setCompletedTopics(completedTopicIds);
                setCompletedMilestones(completedMilestoneIds);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load study plan');
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format datetime for display
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    // Toggle topic completion
    const toggleTopicCompletion = async (topicId) => {
        if (!studyPlan) return;

        const isCurrentlyCompleted = completedTopics.has(topicId);
        const newCompleted = !isCurrentlyCompleted;
        
        try {
            // Update completion status via API
            await plansService.updateTopicCompletion(studyPlanId, topicId, newCompleted);
            
            // Update local state
            const newCompletedTopics = new Set(completedTopics);
            if (newCompleted) {
                newCompletedTopics.add(topicId);
            } else {
                newCompletedTopics.delete(topicId);
            }
            setCompletedTopics(newCompletedTopics);
            
            // Reload to get updated data from server
            loadStudyPlan();
            
            // Notify parent component to refresh its data
            if (onTopicUpdate) {
                onTopicUpdate();
            }
        } catch (error) {
            console.error('Failed to update topic completion:', error);
            // You could show a toast notification here
        }
    };

    // Toggle milestone completion
    const toggleMilestoneCompletion = (milestoneId) => {
        const newCompletedMilestones = new Set(completedMilestones);
        
        if (completedMilestones.has(milestoneId)) {
            newCompletedMilestones.delete(milestoneId);
        } else {
            newCompletedMilestones.add(milestoneId);
        }
        
        setCompletedMilestones(newCompletedMilestones);
    };

    if (loading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Study Plan Details">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading study plan...</p>
                </div>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Study Plan Details">
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={loadStudyPlan}>Try Again</Button>
                </div>
            </Modal>
        );
    }

    if (!studyPlan) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Study Plan Details">
                <div className="text-center py-12">
                    <p className="text-gray-500">Study plan not found</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={studyPlan.title}
            size="lg"
            actions={
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    
                    {studyPlan.status === 'draft' && (
                        <Button onClick={() => onActivate(studyPlan.id)}>
                            Activate Plan
                        </Button>
                    )}
                    
                    {studyPlan.status === 'active' && (
                        <>
                            <Button variant="outline" onClick={() => onPause(studyPlan.id)}>
                                Pause
                            </Button>
                            <Button onClick={() => onComplete(studyPlan.id)}>
                                Mark Complete
                            </Button>
                        </>
                    )}
                    
                    {studyPlan.status === 'paused' && (
                        <Button onClick={() => onActivate(studyPlan.id)}>
                            Reactivate
                        </Button>
                    )}

                    {studyPlan.status === 'completed' && (
                        <>
                            <Button variant="outline" onClick={() => onSetDraft(studyPlan.id)}>
                                Set to Draft
                            </Button>
                            <Button onClick={() => onSetActive(studyPlan.id)}>
                                Set to Active
                            </Button>
                        </>
                    )}
                    
                    {studyPlan.status !== 'completed' && (
                        <Button onClick={() => onEdit(studyPlan)}>
                            Edit Plan
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header Information */}
                <div className="border-b pb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(studyPlan.status)}`}>
                                    {studyPlan.status.charAt(0).toUpperCase() + studyPlan.status.slice(1)}
                                </span>
                                {studyPlan.is_overdue && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                        Overdue
                                    </span>
                                )}
                            </div>
                            
                            {studyPlan.course_info && (
                                <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Course:</span> {studyPlan.course_info.name}
                                    {studyPlan.course_info.code && (
                                        <span className="text-gray-500"> ({studyPlan.course_info.code})</span>
                                    )}
                                </div>
                            )}
                            
                            {studyPlan.description && (
                                <p className="text-gray-700">{studyPlan.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-500">Progress</span>
                            <span className="text-lg font-semibold">{Math.round(studyPlan.progress_percentage)}%</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Duration</span>
                            <span className="font-medium">
                                {studyPlan.duration_days ? `${studyPlan.duration_days} days` : 'Not set'}
                            </span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Days Remaining</span>
                            <span className={`font-medium ${studyPlan.is_overdue ? 'text-red-600' : ''}`}>
                                {studyPlan.days_remaining !== null
                                    ? studyPlan.days_remaining > 0
                                        ? `${studyPlan.days_remaining} days`
                                        : studyPlan.days_remaining === 0
                                        ? 'Due today'
                                        : 'Overdue'
                                    : 'Not set'
                                }
                            </span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Est. Hours</span>
                            <span className="font-medium">
                                {studyPlan.plan_summary?.estimated_hours || 0}h
                            </span>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-3 mt-4">
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Study Progress</span>
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
                        
                        {studyPlan.time_progress_percentage !== undefined && (
                            <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Time Progress</span>
                                    <span className="font-medium">{Math.round(studyPlan.time_progress_percentage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                        className={`h-1 rounded-full transition-all duration-300 ${
                                            studyPlan.is_overdue ? 'bg-red-400' : 'bg-gray-400'
                                        }`}
                                        style={{ width: `${Math.min(100, studyPlan.time_progress_percentage)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Timeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-500 mb-1">Start Date</span>
                            <span className="font-medium">{formatDate(studyPlan.start_date)}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 mb-1">End Date</span>
                            <span className={`font-medium ${studyPlan.is_overdue ? 'text-red-600' : ''}`}>
                                {formatDate(studyPlan.end_date)}
                            </span>
                        </div>
                        <div>
                            <span className="block text-gray-500 mb-1">Last Updated</span>
                            <span className="font-medium">{formatDateTime(studyPlan.updated_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Study Topics */}
                {studyPlan.plan_data?.topics?.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Study Topics</h3>
                        <div className="space-y-3">
                            {studyPlan.plan_data.topics.map((topic, index) => (
                                <div
                                    key={topic.id || index}
                                    className={`p-4 border rounded-lg transition-colors ${
                                        completedTopics.has(topic.id) ? 'bg-green-50 border-green-200' : 'bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <button
                                                    onClick={() => toggleTopicCompletion(topic.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                        completedTopics.has(topic.id)
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-gray-300 hover:border-green-400'
                                                    }`}
                                                    disabled={!['active', 'completed'].includes(studyPlan.status)}
                                                >
                                                    {completedTopics.has(topic.id) && (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <h4 className={`font-medium ${completedTopics.has(topic.id) ? 'line-through text-green-700' : ''}`}>
                                                    {topic.title || `Topic ${index + 1}`}
                                                </h4>
                                            </div>
                                            
                                            {topic.description && (
                                                <p className="text-gray-600 text-sm mb-2 ml-8">
                                                    {topic.description}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
                                                {topic.estimated_hours && (
                                                    <span>Est. {topic.estimated_hours}h</span>
                                                )}
                                                {topic.difficulty_level && (
                                                    <span>
                                                        Difficulty: {topic.difficulty_level}/5
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                                <strong>Topics Progress:</strong> {completedTopics.size} of {studyPlan.plan_data.topics.length} completed
                                ({Math.round((completedTopics.size / studyPlan.plan_data.topics.length) * 100)}%)
                            </div>
                        </div>
                    </div>
                )}

                {/* Milestones */}
                {studyPlan.plan_data?.milestones?.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Milestones</h3>
                        <div className="space-y-3">
                            {studyPlan.plan_data.milestones.map((milestone, index) => (
                                <div
                                    key={milestone.id || index}
                                    className={`p-4 border rounded-lg ${
                                        completedMilestones.has(milestone.id) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <button
                                                    onClick={() => toggleMilestoneCompletion(milestone.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                        completedMilestones.has(milestone.id)
                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                            : 'border-gray-300 hover:border-blue-400'
                                                    }`}
                                                    disabled={!['active', 'completed'].includes(studyPlan.status)}
                                                >
                                                    {completedMilestones.has(milestone.id) && (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <h4 className={`font-medium ${completedMilestones.has(milestone.id) ? 'line-through text-blue-700' : ''}`}>
                                                    {milestone.title || `Milestone ${index + 1}`}
                                                </h4>
                                            </div>
                                            
                                            {milestone.description && (
                                                <p className="text-gray-600 text-sm mb-2 ml-8">
                                                    {milestone.description}
                                                </p>
                                            )}
                                            
                                            {milestone.due_date && (
                                                <div className="text-xs text-gray-500 ml-8">
                                                    Due: {formatDate(milestone.due_date)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                                <strong>Milestones Progress:</strong> {completedMilestones.size} of {studyPlan.plan_data.milestones.length} completed
                                ({Math.round((completedMilestones.size / studyPlan.plan_data.milestones.length) * 100)}%)
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {(!studyPlan.plan_data?.topics?.length && !studyPlan.plan_data?.milestones?.length) && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <p className="text-gray-600 mb-4">This study plan doesn't have any topics or milestones yet.</p>
                        {studyPlan.status !== 'completed' && (
                            <Button onClick={() => onEdit(studyPlan)}>
                                Add Content
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StudyPlanDetailModal;
