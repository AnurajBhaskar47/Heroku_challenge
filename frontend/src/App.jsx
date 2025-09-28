import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicRoute } from './hooks/useAuth.jsx';
import Layout from './components/common/Layout.jsx';

// Import pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import StudyPlansPage from './pages/StudyPlansPage.jsx';
import AIAssistantPage from './pages/AIAssistantPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

// Error boundary component
import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Oops! Something went wrong
                            </h2>
                            <p className="text-gray-600 mb-6">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-6 text-xs text-gray-500">
                                <summary className="cursor-pointer">Error Details (Development)</summary>
                                <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs">
                                    {this.state.error && this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// 404 Page component
const NotFoundPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
            <div className="mx-auto h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg
                    className="h-12 w-12 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"
                    />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Page Not Found
            </h2>
            <p className="text-gray-600 mb-6">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="space-x-4">
                <button
                    onClick={() => window.history.back()}
                    className="bg-secondary-200 text-secondary-800 px-4 py-2 rounded-md hover:bg-secondary-300 transition-colors"
                >
                    Go Back
                </button>
                <a
                    href="/dashboard"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-block"
                >
                    Go to Dashboard
                </a>
            </div>
        </div>
    </div>
);

/**
 * Main App component with routing
 */
function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {/* Public routes */}
                            <Route
                                path="/login"
                                element={
                                    <PublicRoute>
                                        <LoginPage />
                                    </PublicRoute>
                                }
                            />
                            <Route
                                path="/register"
                                element={
                                    <PublicRoute>
                                        <RegisterPage />
                                    </PublicRoute>
                                }
                            />

                            {/* Protected routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <DashboardPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/courses"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <CoursesPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/courses/:id"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <CourseDetailPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/study-plans"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <StudyPlansPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/assistant"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <AIAssistantPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/resources"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <ResourcesPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/calendar"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <CalendarPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <SettingsPage />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Root redirect */}
                            <Route
                                path="/"
                                element={<Navigate to="/dashboard" replace />}
                            />

                            {/* 404 page */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
