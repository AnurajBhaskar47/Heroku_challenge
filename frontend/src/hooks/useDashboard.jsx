import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.js';
import { getErrorMessage } from '../services/api.js';

/**
 * Hook for managing dashboard state and data
 */
export const useDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetch all dashboard data
     */
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dashboardService.getDashboardData();
            setDashboardData(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-fetch data on mount
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        dashboardData,
        loading,
        error,
        refreshDashboard: fetchDashboardData,
    };
};
