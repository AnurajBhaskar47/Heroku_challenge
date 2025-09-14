"""
URL configuration for the ai_assistant app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AIAssistantViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'ai-assistant', AIAssistantViewSet, basename='aiassistant')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]
