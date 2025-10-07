package com.studybud.util;

/**
 * Application-wide constants to avoid hardcoded strings
 */
public class Constants {
    private Constants() {}
    
    // FIELD NAMES (for JSON mapping & validation)
    public static final String FIELD_ID = "id";
    public static final String FIELD_NAME = "name";
    public static final String FIELD_CODE = "code";
    public static final String FIELD_EMAIL = "email";
    public static final String FIELD_USERNAME = "username";
    public static final String FIELD_PASSWORD = "password";
    public static final String FIELD_FIRST_NAME = "firstName";
    public static final String FIELD_LAST_NAME = "lastName";
    public static final String FIELD_DESCRIPTION = "description";
    public static final String FIELD_INSTRUCTOR = "instructor";
    public static final String FIELD_CREDITS = "credits";
    public static final String FIELD_SEMESTER = "semester";
    public static final String FIELD_START_DATE = "startDate";
    public static final String FIELD_END_DATE = "endDate";
    public static final String FIELD_DIFFICULTY_LEVEL = "difficultyLevel";
    public static final String FIELD_IS_ACTIVE = "isActive";
    public static final String FIELD_PROGRESS_PERCENTAGE = "progressPercentage";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_UPDATED_AT = "updatedAt";
    public static final String FIELD_TIMEZONE = "timezone";
    public static final String FIELD_YEAR_OF_STUDY = "yearOfStudy";
    public static final String FIELD_MAJOR = "major";
    public static final String FIELD_TIMESTAMP = "timestamp";
    public static final String FIELD_ERROR = "error";
    public static final String FIELD_DETAILS = "details";
    public static final String FIELD_PATH = "path";
    public static final String FIELD_TITLE = "title";
    public static final String FIELD_ASSIGNMENT_TYPE = "assignmentType";
    public static final String FIELD_DUE_DATE = "dueDate";
    public static final String FIELD_ESTIMATED_HOURS = "estimatedHours";
    public static final String FIELD_WEIGHT = "weight";
    public static final String FIELD_GRADE = "grade";
    public static final String FIELD_STATUS = "status";
    public static final String FIELD_COURSE_ID = "courseId";
    public static final String FIELD_COURSE_NAME = "courseName";

    // RESOURCE NAMES (for error messages)
    public static final String RESOURCE_USER = "User";
    public static final String RESOURCE_COURSE = "Course";
    public static final String RESOURCE_ASSIGNMENT = "Assignment";
    public static final String RESOURCE_STUDY_PLAN = "StudyPlan";

    // ERROR MESSAGES
    public static final String ERROR_USERNAME_TAKEN = "Username is already taken";
    public static final String ERROR_EMAIL_IN_USE = "Email is already in use";
    public static final String ERROR_USER_NOT_FOUND = "User not found";
    public static final String ERROR_INVALID_REFRESH_TOKEN = "Invalid refresh token";
    public static final String ERROR_INVALID_CREDENTIALS = "Invalid username or password";
    public static final String ERROR_RESOURCE_NOT_FOUND = "Resource not found";
    public static final String ERROR_BAD_REQUEST = "Bad request";
    public static final String ERROR_UNAUTHORIZED = "Unauthorized";
    public static final String ERROR_AUTHENTICATION_FAILED = "Authentication failed";
    public static final String ERROR_VALIDATION = "Validation error";
    public static final String ERROR_INTERNAL_SERVER = "Internal server error";
    public static final String ERROR_COURSE_NAME_REQUIRED = "Course name is required";
    public static final String ERROR_ASSIGNMENT_TITLE_REQUIRED = "Assignment title is required";
    public static final String ERROR_DUE_DATE_REQUIRED = "Due date is required";
    public static final String ERROR_INVALID_STATUS = "Invalid assignment status";

    // SUCCESS MESSAGES
    public static final String SUCCESS_USER_REGISTERED = "User registered successfully";

    // DEFAULT VALUES
    public static final String DEFAULT_TIMEZONE = "UTC";
    public static final String DEFAULT_ASSIGNMENT_TYPE = "homework";
    public static final String DEFAULT_ASSIGNMENT_STATUS = "not_started";

    // FORMAT STRINGS
    public static final String FORMAT_RESOURCE_NOT_FOUND = "%s not found with %s: '%s'";

    // MISCELLANEOUS
    public static final String URI_PREFIX = "uri=";
    public static final String EMPTY_STRING = "";

    // DATABASE COLUMN NAMES
    public static final String COLUMN_USER_ID = "user_id";
    public static final String COLUMN_COURSE_ID = "course_id";
    public static final String COLUMN_FIRST_NAME = "first_name";
    public static final String COLUMN_LAST_NAME = "last_name";
    public static final String COLUMN_YEAR_OF_STUDY = "year_of_study";
    public static final String COLUMN_IS_ACTIVE = "is_active";
    public static final String COLUMN_IS_STAFF = "is_staff";
    public static final String COLUMN_IS_SUPERUSER = "is_superuser";
    public static final String COLUMN_LAST_LOGIN = "last_login";
    public static final String COLUMN_DATE_JOINED = "date_joined";
    public static final String COLUMN_STUDY_PREFERENCES = "study_preferences";
    public static final String COLUMN_START_DATE = "start_date";
    public static final String COLUMN_END_DATE = "end_date";
    public static final String COLUMN_DIFFICULTY_LEVEL = "difficulty_level";
    public static final String COLUMN_SYLLABUS_TEXT = "syllabus_text";
    public static final String COLUMN_CLASS_SCHEDULE = "class_schedule";
    public static final String COLUMN_CREATED_AT = "created_at";
    public static final String COLUMN_UPDATED_AT = "updated_at";
    public static final String COLUMN_ASSIGNMENT_TYPE = "assignment_type";
    public static final String COLUMN_DUE_DATE = "due_date";
    public static final String COLUMN_ESTIMATED_HOURS = "estimated_hours";

    // DATABASE TABLE NAMES
    public static final String TABLE_ACCOUNTS_USER = "accounts_user";
    public static final String TABLE_COURSES_COURSE = "courses_course";
    public static final String TABLE_COURSES_ASSIGNMENT = "courses_assignment";

    // ASSIGNMENT STATUS VALUES
    public static final String STATUS_NOT_STARTED = "not_started";
    public static final String STATUS_IN_PROGRESS = "in_progress";
    public static final String STATUS_SUBMITTED = "submitted";
    public static final String STATUS_COMPLETED = "completed";
    public static final String STATUS_OVERDUE = "overdue";

    // ASSIGNMENT TYPES
    public static final String TYPE_HOMEWORK = "homework";
    public static final String TYPE_QUIZ = "quiz";
    public static final String TYPE_EXAM = "exam";
    public static final String TYPE_PROJECT = "project";
    public static final String TYPE_LAB = "lab";
    public static final String TYPE_ESSAY = "essay";
    public static final String TYPE_PRESENTATION = "presentation";
    public static final String TYPE_DISCUSSION = "discussion";
    public static final String TYPE_OTHER = "other";
}
