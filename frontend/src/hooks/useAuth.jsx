import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/auth.js';

const AuthContext = createContext(null);

/**
 * AuthProvider component to wrap the app and provide auth state
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const savedUser = localStorage.getItem('user');

                if (token && savedUser) {
                    // Try to parse saved user
                    try {
                        const userData = JSON.parse(savedUser);
                        setUser(userData);

                        // Verify the token is still valid by fetching fresh profile
                        const profile = await authService.getProfile();
                        setUser(profile);
                        localStorage.setItem('user', JSON.stringify(profile));
                    } catch (profileError) {
                        console.warn('Profile fetch failed, clearing auth state:', profileError);
                        // Token might be expired, clear everything
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Clear potentially corrupted auth state
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    /**
     * Login function
     * @param {Object} credentials
     * @param {string} credentials.username
     * @param {string} credentials.password
     */
    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.login(credentials);
            const { access, refresh } = response.tokens || response;
            const userData = response.user || response;

            // Save tokens and user data
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.detail ||
                'Login failed. Please check your credentials.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Register function
     * @param {Object} userData
     */
    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.register(userData);
            const { access, refresh } = response.tokens;
            const newUser = response.user;

            // Save tokens and user data
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(newUser));

            setUser(newUser);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.detail ||
                'Registration failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout function
     */
    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            // Clear auth state regardless of API response
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
            setError(null);
        }
    };

    /**
     * Update profile function
     * @param {Object} profileData
     */
    const updateProfile = async (profileData) => {
        try {
            setError(null);
            setLoading(true);

            const updatedUser = await authService.updateProfile(profileData);

            // Update local storage and state
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            return { success: true, user: updatedUser };
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.detail ||
                error.response?.data?.non_field_errors?.[0] ||
                'Profile update failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Protected Route component - only allows authenticated users
 */
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

/**
 * Public Route component - redirects authenticated users to dashboard
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};
