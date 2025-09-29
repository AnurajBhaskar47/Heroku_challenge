"""
URL configuration for study_bud project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.accounts.views import HealthCheckView


class ReactAppView(TemplateView):
    """
    Custom view to serve React app with proper Django context.
    """
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'debug': settings.DEBUG,
            'use_vector_search': getattr(settings, 'USE_VECTOR_SEARCH', False),
        })
        return context


urlpatterns = [
    path('admin/', admin.site.urls),

    # API URLs - All ViewSets are registered in accounts.urls
    path('api/', include('apps.accounts.urls')),

    # OpenAPI/Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Health check endpoint (direct import to avoid router conflicts)
    path('health/', HealthCheckView.as_view(), name='health-check'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)

# Serve React app for all non-API routes (production and development)
# This should be last to allow all API routes to be matched first
# Exclude admin, API, health, and media from React app routing
# Note: /assets/ is handled by WhiteNoise for static files
urlpatterns += [
    re_path(r'^(?!api/)(?!admin/)(?!health/)(?!media/).*$', ReactAppView.as_view()),
]
