"""
URL configuration for the accounts app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AuthViewSet,
    UserViewSet,
    HealthCheckView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView
)

# Create router for all ViewSets
router = DefaultRouter()

# Register accounts viewsets
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'profile', UserViewSet, basename='profile')

# Register other app viewsets
try:
    from apps.study_plans.views import StudyPlanViewSet
    from apps.resources.views import ResourceViewSet, ResourceCollectionViewSet
    from apps.ai_assistant.views import AIAssistantViewSet

    router.register(r'study-plans', StudyPlanViewSet, basename='studyplan')
    router.register(r'resources', ResourceViewSet, basename='resource')
    router.register(r'collections', ResourceCollectionViewSet,
                    basename='collection')
    router.register(r'ai-assistant', AIAssistantViewSet,
                    basename='aiassistant')
except ImportError:
    # Apps may not be ready during initial setup
    pass

urlpatterns = [
    # Health check
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # JWT Token refresh endpoint (login handled by AuthViewSet)
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),

    # Current user profile endpoints (without requiring user ID)
    path('profile/', UserViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'put': 'partial_update'
    }), name='current-user-profile'),

    # Include courses with nested assignments
    path('', include('apps.courses.urls')),

    # Include router URLs (auth, study plans, resources, AI assistant)
    path('', include(router.urls)),

    # Include dashboard URL
    path('dashboard/', include('apps.dashboard.urls')),
]
