import { useState } from 'react';
import Button from '../components/common/Button.jsx';
import { EmptyStudyPlansState } from '../components/common/EmptyState.jsx';
import Loader from '../components/common/Loader.jsx';
import StudyPlanCard from '../components/study-plans/StudyPlanCard.jsx';
import StudyPlanFormModal from '../components/study-plans/StudyPlanFormModal.jsx';
import StudyPlanDetailModal from '../components/study-plans/StudyPlanDetailModal.jsx';
import useStudyPlans from '../hooks/useStudyPlans.jsx';
import { plansService } from '../services/plans.js';

/**
 * Study Plans page component
 */
const StudyPlansPage = () => {
    const {
        studyPlans,
        loading,
        error,
        stats,
        loadStudyPlans,
        createStudyPlan,
        updateStudyPlan,
        deleteStudyPlan,
        updateProgress,
        activateStudyPlan,
        setError
    } = useStudyPlans();

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStudyPlan, setSelectedStudyPlan] = useState(null);
    const [detailStudyPlanId, setDetailStudyPlanId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, active, completed, draft, overdue

    // Handle creating a new study plan
    const handleCreatePlan = () => {
        setSelectedStudyPlan(null);
        setShowFormModal(true);
    };

    // Handle editing a study plan
    const handleEditPlan = (studyPlan) => {
        setSelectedStudyPlan(studyPlan);
        setShowFormModal(true);
    };

    // Handle viewing study plan details
    const handleViewPlan = (studyPlanId) => {
        setDetailStudyPlanId(studyPlanId);
        setShowDetailModal(true);
    };

    // Handle form submission
    const handleFormSubmit = async (formData) => {
        setFormLoading(true);
        try {
            let result;
            if (selectedStudyPlan) {
                result = await updateStudyPlan(selectedStudyPlan.id, formData);
            } else {
                result = await createStudyPlan(formData);
            }

            if (result.success) {
                setShowFormModal(false);
                setSelectedStudyPlan(null);
                loadStudyPlans(); // Refresh the study plans list to show updates
            }
        } catch (err) {
            console.error('Failed to save study plan:', err);
        } finally {
            setFormLoading(false);
        }
    };

    // Handle deleting a study plan
    const handleDeletePlan = async (studyPlanId) => {
        await deleteStudyPlan(studyPlanId);
    };

    // Handle activating a study plan
    const handleActivatePlan = async (studyPlanId) => {
        await activateStudyPlan(studyPlanId);
    };

    // Handle pausing a study plan
    const handlePausePlan = async (studyPlanId) => {
        try {
            await plansService.pausePlan(studyPlanId);
            // Update the study plans list without page reload
            loadStudyPlans();
        } catch (err) {
            console.error('Failed to pause study plan:', err);
        }
    };

    // Handle completing a study plan
    const handleCompletePlan = async (studyPlanId) => {
        try {
            await plansService.completePlan(studyPlanId);
            // Update the study plans list without page reload
            loadStudyPlans();
        } catch (err) {
            console.error('Failed to complete study plan:', err);
        }
    };

    // Handle duplicating a study plan
    const handleDuplicatePlan = async (studyPlanId) => {
        try {
            await plansService.duplicatePlan(studyPlanId);
            // Update the study plans list without page reload
            loadStudyPlans();
        } catch (err) {
            console.error('Failed to duplicate study plan:', err);
        }
    };

    // Handle progress update
    const handleUpdateProgress = async (studyPlanId, progress) => {
        await updateProgress(studyPlanId, progress);
    };

    // Handle setting study plan to draft
    const handleSetDraft = async (studyPlanId) => {
        try {
            // Reset progress to 0% when going from completed to draft
            await updateStudyPlan(studyPlanId, { status: 'draft', progress_percentage: 0 });
            loadStudyPlans();
        } catch (err) {
            console.error('Failed to set study plan to draft:', err);
        }
    };

    // Handle setting study plan to active
    const handleSetActive = async (studyPlanId) => {
        try {
            // Reset progress to 0% when going from completed to active
            await updateStudyPlan(studyPlanId, { status: 'active', progress_percentage: 0 });
            loadStudyPlans();
        } catch (err) {
            console.error('Failed to set study plan to active:', err);
        }
    };

    // Filter study plans
    const getFilteredStudyPlans = () => {
        switch (filter) {
            case 'active':
                return studyPlans.filter(plan => plan.status === 'active');
            case 'completed':
                return studyPlans.filter(plan => plan.status === 'completed');
            case 'draft':
                return studyPlans.filter(plan => plan.status === 'draft');
            case 'overdue':
                return studyPlans.filter(plan => plan.is_overdue);
            default:
                return studyPlans;
        }
    };

    const filteredStudyPlans = getFilteredStudyPlans();

    // Close modals
    const handleCloseFormModal = () => {
        setShowFormModal(false);
        setSelectedStudyPlan(null);
        setError(null);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setDetailStudyPlanId(null);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                </div>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                    <Button onClick={handleCreatePlan}>Create Study Plan</Button>
                </div>
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </div>
        );
    }

    if (studyPlans.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                    <Button onClick={handleCreatePlan}>Create Study Plan</Button>
                </div>
                <EmptyStudyPlansState onCreatePlan={handleCreatePlan} />
                
                {/* Form Modal */}
                <StudyPlanFormModal
                    isOpen={showFormModal}
                    onClose={handleCloseFormModal}
                    onSubmit={handleFormSubmit}
                    studyPlan={selectedStudyPlan}
                    isLoading={formLoading}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                    <p className="text-gray-600">
                        Create and manage your personalized study plans
                    </p>
                </div>
                <Button onClick={handleCreatePlan}>Create Study Plan</Button>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-gray-900">{stats.total_plans}</div>
                        <div className="text-sm text-gray-500">Total Plans</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">{stats.active_plans}</div>
                        <div className="text-sm text-gray-500">Active</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">{stats.completed_plans}</div>
                        <div className="text-sm text-gray-500">Completed</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-gray-600">{stats.draft_plans}</div>
                        <div className="text-sm text-gray-500">Drafts</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-red-600">{stats.overdue_plans}</div>
                        <div className="text-sm text-gray-500">Overdue</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-purple-600">{Math.round(stats.average_progress)}%</div>
                        <div className="text-sm text-gray-500">Avg Progress</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-orange-600">{stats.total_estimated_hours}h</div>
                        <div className="text-sm text-gray-500">Est. Hours</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'all', label: 'All Plans', count: studyPlans.length },
                    { key: 'active', label: 'Active', count: studyPlans.filter(p => p.status === 'active').length },
                    { key: 'completed', label: 'Completed', count: studyPlans.filter(p => p.status === 'completed').length },
                    { key: 'draft', label: 'Drafts', count: studyPlans.filter(p => p.status === 'draft').length },
                    { key: 'overdue', label: 'Overdue', count: studyPlans.filter(p => p.is_overdue).length },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            filter === key
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {label} ({count})
                    </button>
                ))}
            </div>

            {/* Study Plans Grid */}
            {filteredStudyPlans.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredStudyPlans.map((plan) => (
                        <StudyPlanCard
                            key={plan.id}
                            studyPlan={plan}
                            onEdit={handleEditPlan}
                            onDelete={handleDeletePlan}
                            onView={handleViewPlan}
                            onActivate={handleActivatePlan}
                            onPause={handlePausePlan}
                            onComplete={handleCompletePlan}
                            onDuplicate={handleDuplicatePlan}
                            onUpdateProgress={handleUpdateProgress}
                            onSetDraft={handleSetDraft}
                            onSetActive={handleSetActive}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-4">
                        No study plans found for the selected filter.
                    </p>
                    <Button variant="outline" onClick={() => setFilter('all')}>
                        Show All Plans
                    </Button>
                </div>
            )}

            {/* Modals */}
            <StudyPlanFormModal
                isOpen={showFormModal}
                onClose={handleCloseFormModal}
                onSubmit={handleFormSubmit}
                studyPlan={selectedStudyPlan}
                isLoading={formLoading}
            />

            <StudyPlanDetailModal
                isOpen={showDetailModal}
                onClose={handleCloseDetailModal}
                studyPlanId={detailStudyPlanId}
                onEdit={handleEditPlan}
                onDelete={handleDeletePlan}
                onUpdateProgress={handleUpdateProgress}
                onActivate={handleActivatePlan}
                onPause={handlePausePlan}
                onComplete={handleCompletePlan}
                onSetDraft={handleSetDraft}
                onSetActive={handleSetActive}
            />
        </div>
    );
};

export default StudyPlansPage;
