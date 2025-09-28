"""
URL configuration for the courses app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from .views import (
    CourseViewSet, 
    NestedAssignmentViewSet, 
    GlobalAssignmentViewSet,
    CourseQuizViewSet,
    CourseAssignmentFileViewSet,
    CourseTopicViewSet,
    CourseTopicItemViewSet,
    ExamViewSet
)

# Create main router
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'assignments', GlobalAssignmentViewSet,
                basename='global-assignment')

# Create nested routers for course content
courses_router = NestedDefaultRouter(router, r'courses', lookup='course')
courses_router.register(
    r'assignments', NestedAssignmentViewSet, basename='course-assignments')
courses_router.register(
    r'quiz-files', CourseQuizViewSet, basename='course-quizzes')
courses_router.register(
    r'assignment-files', CourseAssignmentFileViewSet, basename='course-assignment-files')
courses_router.register(
    r'topics', CourseTopicViewSet, basename='course-topics')
courses_router.register(
    r'topic-items', CourseTopicItemViewSet, basename='course-topic-items')
courses_router.register(
    r'exams', ExamViewSet, basename='course-exams')

urlpatterns = [
    # Include main router URLs
    path('', include(router.urls)),

    # Include nested router URLs
    path('', include(courses_router.urls)),
]
