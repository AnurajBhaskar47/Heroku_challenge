import { useState, useEffect } from 'react';
import { plansService } from '../services/plans.js';

/**
 * Custom hook for managing study plans
 */
export const useStudyPlans = () => {
    const [studyPlans, setStudyPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Load study plans
    const loadStudyPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await plansService.getPlans();
            // Extract results array from paginated response
            const data = response.results || response || [];
            setStudyPlans(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load study plans');
        } finally {
            setLoading(false);
        }
    };

    // Load study plan statistics
    const loadStats = async () => {
        try {
            const response = await plansService.getStats();
            setStats(response);
        } catch (err) {
            console.error('Failed to load study plan stats:', err);
        }
    };

    // Create a new study plan
    const createStudyPlan = async (planData) => {
        try {
            setError(null);
            const newPlan = await plansService.createPlan(planData);
            setStudyPlans(prev => [newPlan, ...prev]);
            return { success: true, data: newPlan };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create study plan';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Update an existing study plan
    const updateStudyPlan = async (planId, planData) => {
        try {
            setError(null);
            const updatedPlan = await plansService.updatePlan(planId, planData);
            setStudyPlans(prev =>
                prev.map(plan => plan.id === planId ? updatedPlan : plan)
            );
            return { success: true, data: updatedPlan };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update study plan';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Delete a study plan
    const deleteStudyPlan = async (planId) => {
        try {
            setError(null);
            await plansService.deletePlan(planId);
            setStudyPlans(prev => prev.filter(plan => plan.id !== planId));
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete study plan';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Update progress of a study plan
    const updateProgress = async (planId, progress) => {
        try {
            setError(null);
            const updatedPlan = await plansService.updateProgress(planId, progress);
            setStudyPlans(prev =>
                prev.map(plan => plan.id === planId ? updatedPlan : plan)
            );
            return { success: true, data: updatedPlan };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update progress';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Activate a study plan
    const activateStudyPlan = async (planId) => {
        try {
            setError(null);
            const updatedPlan = await plansService.activatePlan(planId);
            setStudyPlans(prev =>
                prev.map(plan => plan.id === planId ? updatedPlan : plan)
            );
            return { success: true, data: updatedPlan };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to activate study plan';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Get active study plans
    const getActivePlans = () => {
        return studyPlans.filter(plan => plan.status === 'active');
    };

    // Get completed study plans
    const getCompletedPlans = () => {
        return studyPlans.filter(plan => plan.status === 'completed');
    };

    // Get overdue study plans
    const getOverduePlans = () => {
        return studyPlans.filter(plan => plan.is_overdue);
    };

    // Get study plan by ID
    const getStudyPlan = (planId) => {
        return studyPlans.find(plan => plan.id === planId);
    };

    // Initialize data on mount
    useEffect(() => {
        loadStudyPlans();
        loadStats();
    }, []);

    return {
        studyPlans,
        loading,
        error,
        stats,
        loadStudyPlans,
        loadStats,
        createStudyPlan,
        updateStudyPlan,
        deleteStudyPlan,
        updateProgress,
        activateStudyPlan,
        getActivePlans,
        getCompletedPlans,
        getOverduePlans,
        getStudyPlan,
        setError, // Allow clearing error state
    };
};

export default useStudyPlans;
