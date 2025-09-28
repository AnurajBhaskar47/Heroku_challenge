import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Card, { CardHeader, CardTitle, CardBody } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import { useDashboard } from '../hooks/useDashboard.jsx';
import { formatDate, timeAgo } from '../utils/formatters.js';

/**
 * Dashboard page component
 */
const DashboardPage = () => {
    const { user } = useAuth();
    const { dashboardData, loading, error, refreshDashboard } = useDashboard();

    const quickActions = [
        {
            title: 'Courses',
            description: 'Manage your courses, add assignments, and track syllabus.',
            href: '/courses',
            icon: (
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            color: 'bg-blue-50 border-blue-200',
        },
        {
            title: 'Study Plans',
            description: 'Create personalized study plans and track your progress.',
            href: '/study-plans',
            icon: (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            color: 'bg-green-50 border-green-200',
        },
        {
            title: 'AI Assistant',
            description: 'Get help with explanations, study plans, and resource discovery.',
            href: '/assistant',
            icon: (
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            color: 'bg-purple-50 border-purple-200',
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
                    <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <Button onClick={refreshDashboard} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { stats, upcoming_assignments, upcoming_exams, upcoming_study_plan_deadlines, recent_courses } = dashboardData || {};

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.first_name || user?.username}!
                </h1>
                <p className="text-gray-600">
                    Here&apos;s your learning dashboard. Ready to continue your studies?
                </p>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <Link key={action.title} to={action.href}>
                            <Card className={`${action.color} hover:shadow-lg transition-all duration-200 cursor-pointer`} hover>
                                <CardBody className="p-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            {action.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                {action.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                {action.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Courses</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.total_courses || 0}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Pending Assignments</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.pending_assignments || 0}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Study Plans</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.total_study_plans || 0}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Study Streak</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.study_streak_days || 0} days</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Upcoming Exams/Quizzes and Study Plan Deadlines */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Exams/Quizzes */}
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Exams & Quizzes</h2>
                    <Card className="flex-1">
                        <CardBody className="flex flex-col min-h-[200px]">
                            {upcoming_exams?.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming_exams.map((exam) => (
                                        <Link to={`/courses/${exam.course_id}`} key={exam.id} className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <p className="text-sm font-medium text-gray-900">{exam.name}</p>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                            exam.exam_type === 'quiz' ? 'bg-blue-100 text-blue-800' :
                                                            exam.exam_type === 'midterm' ? 'bg-orange-100 text-orange-800' :
                                                            exam.exam_type === 'final' ? 'bg-red-100 text-red-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {exam.exam_type_display}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">{exam.course_name}</p>
                                                    {exam.location && (
                                                        <p className="text-xs text-gray-500 mt-1">📍 {exam.location}</p>
                                                    )}
                                                    <div className="mt-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">Preparation:</span>
                                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-20">
                                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${exam.preparation_percentage}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-600">{Math.round(exam.preparation_percentage)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-3">
                                                    <p className="text-sm font-medium text-blue-600">{formatDate(exam.exam_date)}</p>
                                                    <p className="text-xs text-gray-500">{exam.days_until_exam} days left</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm text-gray-500">No upcoming exams or quizzes in the next 14 days.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Upcoming Study Plan Deadlines */}
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Study Plan Deadlines</h2>
                    <Card className="flex-1">
                        <CardBody className="flex flex-col min-h-[200px]">
                            {upcoming_study_plan_deadlines?.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming_study_plan_deadlines.map((deadline) => (
                                        <Link to={`/study-plans`} key={deadline.id} className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                            deadline.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            deadline.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {deadline.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">Progress:</span>
                                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-20">
                                                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${deadline.progress_percentage}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-600">{Math.round(deadline.progress_percentage)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-3">
                                                    <p className="text-sm font-medium text-green-600">{formatDate(deadline.end_date)}</p>
                                                    <p className="text-xs text-gray-500">{deadline.days_until_deadline} days left</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    <p className="text-sm text-gray-500">No upcoming study plan deadlines in the next 14 days.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Assignments */}
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Assignments</h2>
                    <Card className="flex-1">
                        <CardBody className="flex flex-col min-h-[200px]">
                            {upcoming_assignments?.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming_assignments.map((assignment) => (
                                        <Link to={`/courses/${assignment.course_id}`} key={assignment.id} className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                                                    <p className="text-xs text-gray-500">{assignment.course_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-red-600">{formatDate(assignment.due_date)}</p>
                                                    <p className="text-xs text-gray-500">{assignment.days_until_due} days left</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                    <p className="text-sm text-gray-500">No upcoming assignments in the next 14 days. Good job!</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Recent Courses */}
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Courses</h2>
                    <Card className="flex-1">
                        <CardBody className="flex flex-col min-h-[200px]">
                            {recent_courses?.length > 0 ? (
                                <div className="space-y-3">
                                    {recent_courses.map((course) => (
                                        <Link to={`/courses/${course.id}`} key={course.id} className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{course.name}</p>
                                                    <p className="text-xs text-gray-500">{course.code} - updated {timeAgo(course.updated_at)}</p>
                                                </div>
                                                <div className="w-20">
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${course.progress_percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                    <p className="text-sm text-gray-500">No recent courses. Add one to get started!</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
