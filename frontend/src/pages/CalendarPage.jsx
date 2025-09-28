import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { coursesService } from '../services/courses';
import { getErrorMessage } from '../services/api';

/**
 * Calendar page for displaying assignments and exam dates
 */
const CalendarPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [selectedCourse]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load courses
            const coursesData = await coursesService.getCourses();
            setCourses(coursesData.results || coursesData || []);

            // Load events for all courses or selected course
            let allEvents = [];
            const coursesToLoad = selectedCourse === 'all' 
                ? (coursesData.results || coursesData || [])
                : [(coursesData.results || coursesData || []).find(c => c.id === parseInt(selectedCourse))].filter(Boolean);

            for (const course of coursesToLoad) {
                try {
                    const courseEvents = await coursesService.getCalendarEvents(course.id);
                    const eventsWithCourse = courseEvents.map(event => ({
                        ...event,
                        courseName: course.name,
                        courseId: course.id
                    }));
                    allEvents = [...allEvents, ...eventsWithCourse];
                } catch (err) {
                    console.error(`Error loading events for course ${course.id}:`, err);
                }
            }

            // Load study plan deadlines (only when showing all courses)
            if (selectedCourse === 'all') {
                try {
                    const studyPlanEvents = await coursesService.getStudyPlanCalendarEvents();
                    allEvents = [...allEvents, ...studyPlanEvents];
                } catch (err) {
                    console.error('Error loading study plan events:', err);
                }
            }

            setEvents(allEvents);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getEventTypeColor = (event) => {
        if (event.type === 'exam') {
            switch (event.exam_type) {
                case 'final': return 'bg-red-100 text-red-800 border-red-200';
                case 'midterm': return 'bg-orange-100 text-orange-800 border-orange-200';
                case 'quiz': return 'bg-blue-100 text-blue-800 border-blue-200';
                default: return 'bg-purple-100 text-purple-800 border-purple-200';
            }
        } else if (event.type === 'study_plan_deadline') {
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        } else {
            switch (event.assignment_type) {
                case 'homework': return 'bg-green-100 text-green-800 border-green-200';
                case 'project': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                case 'lab': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        }
    };

    const getEventIcon = (event) => {
        if (event.type === 'exam') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        } else if (event.type === 'study_plan_deadline') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            );
        } else {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            );
        }
    };

    const groupEventsByDate = (events) => {
        const grouped = {};
        events.forEach(event => {
            const date = new Date(event.start).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });

        // Sort events within each date by time
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(a.start) - new Date(b.start));
        });

        return grouped;
    };

    const getUpcomingEvents = (events, days = 7) => {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);

        return events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate >= now && eventDate <= futureDate;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
    };

    const navigateToCourse = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    const handleEventClick = (event) => {
        if (event.type === 'study_plan_deadline') {
            navigate('/study-plans');
        } else if (event.courseId) {
            navigate(`/courses/${event.courseId}`);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading calendar...</p>
                </div>
            </div>
        );
    }

    const upcomingEvents = getUpcomingEvents(events);
    const groupedEvents = groupEventsByDate(events);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                    <p className="text-gray-600">View all your assignments and exam dates</p>
                </div>
                
                {/* Course Filter */}
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Filter by course:</label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Courses</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Upcoming Events - Left Column */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming (Next 7 Days)</CardTitle>
                        </CardHeader>
                        <CardBody>
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-600 text-sm">No upcoming events</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {upcomingEvents.map((event, index) => (
                                        <div
                                            key={`${event.type}_${event.id || index}`}
                                            className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${getEventTypeColor(event)}`}
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getEventIcon(event)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {event.type === 'study_plan_deadline' 
                                                            ? (event.course_name ? `Course: ${event.course_name}` : 'Study Plan')
                                                            : event.courseName
                                                        }
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-2 text-xs">
                                                        <span>{formatDate(event.start)}</span>
                                                        {event.type !== 'study_plan_deadline' && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{formatTime(event.start)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {event.type === 'exam' && event.location && (
                                                        <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                                                    )}
                                                    {event.type === 'study_plan_deadline' && event.progress_percentage !== undefined && (
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-xs text-gray-500">Progress:</span>
                                                            <div className="flex-1 bg-gray-200 rounded-full h-1 max-w-16">
                                                                <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${event.progress_percentage}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-600">{Math.round(event.progress_percentage)}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* All Events - Right Column */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Events</CardTitle>
                        </CardHeader>
                        <CardBody>
                            {Object.keys(groupedEvents).length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                                    <p className="text-gray-600 mb-4">
                                        {selectedCourse === 'all' 
                                            ? 'No assignments or exams scheduled across all courses.'
                                            : 'No assignments or exams scheduled for this course.'
                                        }
                                    </p>
                                    <Button onClick={() => navigate('/courses')}>
                                        Go to Courses
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6 max-h-96 overflow-y-auto">
                                    {Object.entries(groupedEvents)
                                        .sort(([a], [b]) => new Date(a) - new Date(b))
                                        .map(([date, dateEvents]) => (
                                            <div key={date}>
                                                <h3 className="font-medium text-gray-900 mb-3 sticky top-0 bg-white py-2">
                                                    {formatDate(date)}
                                                </h3>
                                                <div className="space-y-2 ml-4">
                                                    {dateEvents.map((event, index) => (
                                                        <div
                                                            key={`${event.type}_${event.id || index}`}
                                                            className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${getEventTypeColor(event)}`}
                                                            onClick={() => handleEventClick(event)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex-shrink-0">
                                                                        {getEventIcon(event)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium text-sm">{event.title}</h4>
                                                                        <p className="text-xs text-gray-600">
                                                                            {event.type === 'study_plan_deadline' 
                                                                                ? (event.course_name ? `Course: ${event.course_name}` : 'Study Plan')
                                                                                : event.courseName
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    {event.type !== 'study_plan_deadline' && (
                                                                        <p className="text-sm font-medium">{formatTime(event.start)}</p>
                                                                    )}
                                                                    <p className="text-xs text-gray-500 capitalize">
                                                                        {event.type === 'exam' ? event.exam_type : 
                                                                         event.type === 'study_plan_deadline' ? 'Study Plan' : 
                                                                         event.assignment_type}
                                                                    </p>
                                                                    {event.type === 'study_plan_deadline' && event.progress_percentage !== undefined && (
                                                                        <p className="text-xs text-gray-600 mt-1">{Math.round(event.progress_percentage)}% complete</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {event.description && (
                                                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                                                    {event.description}
                                                                </p>
                                                            )}
                                                            {event.type === 'exam' && event.location && (
                                                                <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
