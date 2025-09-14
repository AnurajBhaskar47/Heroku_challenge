/**
 * Application constants
 */

// Assignment types
export const ASSIGNMENT_TYPES = [
    { value: 'homework', label: 'Homework' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'exam', label: 'Exam' },
    { value: 'project', label: 'Project' },
    { value: 'paper', label: 'Paper' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'lab', label: 'Lab' },
    { value: 'other', label: 'Other' },
];

// Assignment status options
export const ASSIGNMENT_STATUS = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
];

// Study plan status options
export const PLAN_STATUS = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

// Difficulty levels (using integers as backend expects 1-5 scale)
export const DIFFICULTY_LEVELS = [
    { value: 1, label: 'Very Easy' },
    { value: 2, label: 'Easy' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'Hard' },
    { value: 5, label: 'Very Hard' },
];

// Academic years (using integers as backend expects)
export const ACADEMIC_YEARS = [
    { value: 1, label: '1st Year (Freshman)' },
    { value: 2, label: '2nd Year (Sophomore)' },
    { value: 3, label: '3rd Year (Junior)' },
    { value: 4, label: '4th Year (Senior)' },
    { value: 5, label: '5th Year' },
    { value: 6, label: 'Graduate Student' },
    { value: 7, label: 'PhD Student' },
];

// Common majors (expandable)
export const COMMON_MAJORS = [
    'Computer Science',
    'Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Psychology',
    'Business Administration',
    'Economics',
    'English',
    'History',
    'Political Science',
    'Sociology',
    'Art',
    'Music',
    'Other',
];

// Timezones (common ones)
export const TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

// Resource types
export const RESOURCE_TYPES = [
    { value: 'video', label: 'Video' },
    { value: 'article', label: 'Article' },
    { value: 'book', label: 'Book' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'course', label: 'Course' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'practice', label: 'Practice Problems' },
    { value: 'other', label: 'Other' },
];

// Semesters
export const SEMESTERS = [
    { value: 'fall', label: 'Fall' },
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'winter', label: 'Winter' },
];

// Credits options
export const CREDIT_OPTIONS = [
    { value: 1, label: '1 Credit' },
    { value: 2, label: '2 Credits' },
    { value: 3, label: '3 Credits' },
    { value: 4, label: '4 Credits' },
    { value: 5, label: '5 Credits' },
    { value: 6, label: '6 Credits' },
];

// Common study preferences
export const STUDY_PREFERENCES = {
    STUDY_DURATION: [
        { value: 25, label: '25 minutes (Pomodoro)' },
        { value: 30, label: '30 minutes' },
        { value: 45, label: '45 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' },
    ],
    BREAK_DURATION: [
        { value: 5, label: '5 minutes' },
        { value: 10, label: '10 minutes' },
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
    ],
    TIME_OF_DAY: [
        { value: 'morning', label: 'Morning (6AM - 12PM)' },
        { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
        { value: 'evening', label: 'Evening (6PM - 10PM)' },
        { value: 'night', label: 'Night (10PM - 2AM)' },
    ],
};

// Status colors for UI
export const STATUS_COLORS = {
    // Assignment status colors
    not_started: 'text-gray-600 bg-gray-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    overdue: 'text-red-600 bg-red-100',

    // Plan status colors
    active: 'text-green-600 bg-green-100',
    paused: 'text-yellow-600 bg-yellow-100',
    cancelled: 'text-red-600 bg-red-100',

    // Difficulty colors
    beginner: 'text-green-600 bg-green-100',
    intermediate: 'text-yellow-600 bg-yellow-100',
    advanced: 'text-orange-600 bg-orange-100',
    expert: 'text-red-600 bg-red-100',
};

// API endpoints (for reference)
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login/',
        REGISTER: '/auth/register/',
        PROFILE: '/auth/profile/',
        REFRESH: '/auth/refresh/',
        LOGOUT: '/auth/logout/',
        CHANGE_PASSWORD: '/auth/change-password/',
    },
    COURSES: '/courses/',
    ASSIGNMENTS: '/assignments/',
    STUDY_PLANS: '/study-plans/',
    AI_ASSISTANT: {
        EXPLAIN: '/ai-assistant/explain/',
        STUDY_PLAN: '/ai-assistant/enhanced-study-plan/',
        SEARCH: '/ai-assistant/semantic-search/',
        CHAT: '/ai-assistant/chat/',
    },
    RESOURCES: '/resources/',
};

// Local storage keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
    THEME: 'theme',
    PREFERENCES: 'preferences',
};

// Default pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Validation rules
export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_TEXT_LENGTH: 1000,
    MAX_TITLE_LENGTH: 200,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
