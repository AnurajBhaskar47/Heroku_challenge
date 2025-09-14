"""
URL configuration for the courses app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from .views import CourseViewSet, NestedAssignmentViewSet, GlobalAssignmentViewSet

# Create main router
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'assignments', GlobalAssignmentViewSet,
                basename='global-assignment')

# Create nested router for course assignments
courses_router = NestedDefaultRouter(router, r'courses', lookup='course')
courses_router.register(
    r'assignments', NestedAssignmentViewSet, basename='course-assignments')

urlpatterns = [
    # Include main router URLs
    path('', include(router.urls)),

    # Include nested router URLs
    path('', include(courses_router.urls)),
]
