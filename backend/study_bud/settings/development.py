"""
Django settings for study_bud project - Development Environment.

For use in local development with SQLite and permissive CORS.
"""

from .base import *  # noqa
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database - SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS Settings - Permissive for development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

# Cache - Simple in-memory cache for development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Email Backend - Console for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Debug toolbar (optional - uncomment if needed)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
# INTERNAL_IPS = ['127.0.0.1', 'localhost']

# Override any environment-specific settings
GOOGLE_GEMINI_API_KEY = config('GOOGLE_GEMINI_API_KEY', default='test-key')
USE_VECTOR_SEARCH = config('USE_VECTOR_SEARCH', default=False, cast=bool)

# Development logging - more verbose
LOGGING['loggers']['study_bud']['level'] = 'DEBUG'

# Frontend development - serve from dev server in development
# Note: In development, you typically run React dev server separately
# But this ensures static files work if you build the React app locally
STATICFILES_DIRS = getattr(locals(), 'STATICFILES_DIRS', [])
if (BASE_DIR.parent / 'frontend' / 'dist').exists():
    # Only add if the build directory exists
    pass  # Already configured in base.py
