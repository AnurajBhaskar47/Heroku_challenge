"""
Django settings for study_bud project - Heroku Production Environment.

For production deployment with PostgreSQL and strict security settings.
"""

import dj_database_url
from .base import *  # noqa
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Heroku dynamically assigns the PORT, so we can't hard-code it
ALLOWED_HOSTS = [
    '.herokuapp.com',
    'studybud-api.herokuapp.com',  # Replace with your actual Heroku app name
]

# Allow custom domains
ALLOWED_HOSTS += config('ALLOWED_HOSTS', default='',
                        cast=lambda v: [s.strip() for s in v.split(',') if s.strip()])

# Database - PostgreSQL with pgvector via DATABASE_URL
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Ensure pgvector extension is available
DATABASES['default']['OPTIONS'] = {
    'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
    'charset': 'utf8mb4',
} if DATABASES['default']['ENGINE'] == 'django.db.backends.mysql' else {}

# CORS Settings - Production
CORS_ALLOWED_ORIGINS = [
    "https://studybud.netlify.app",  # Replace with your frontend domain
    "https://your-frontend-domain.com",
]

# Add environment variable for additional CORS origins
additional_cors_origins = config('CORS_ALLOWED_ORIGINS', default='', cast=lambda v: [
                                 s.strip() for s in v.split(',') if s.strip()])
CORS_ALLOWED_ORIGINS += additional_cors_origins

CORS_ALLOW_CREDENTIALS = True

# Security Settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'

# WhiteNoise configuration for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Static files configuration for Heroku deployment
# Since we copy frontend build files to staticfiles/ during deployment
STATICFILES_DIRS = []

# Ensure static files are served correctly
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Redis Cache (optional - uncomment if using Redis)
"""
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'IGNORE_EXCEPTIONS': True,
        }
    }
}
"""

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Email Configuration (using SendGrid or similar)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.sendgrid.net')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config(
    'DEFAULT_FROM_EMAIL', default='noreply@studybud.com')

# Celery Configuration (if using background tasks)
CELERY_BROKER_URL = config(
    'REDIS_URL', default=config('CLOUDAMQP_URL', default=''))
CELERY_RESULT_BACKEND = config('REDIS_URL', default='')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Production Logging - Stream to stdout for Heroku
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console'],
    },
    'loggers': {
        'django': {
            'level': 'INFO',
            'handlers': ['console'],
            'propagate': False,
        },
        'study_bud': {
            'level': 'INFO',
            'handlers': ['console'],
            'propagate': False,
        },
    },
}

# AI Configuration - Production (OpenAI)
OPENAI_API_KEY = config('OPENAI_API_KEY')
USE_VECTOR_SEARCH = config('USE_VECTOR_SEARCH', default=False, cast=bool)
EMBEDDING_SERVICE = config('EMBEDDING_SERVICE', default='heroku')
AI_FALLBACK_ENABLED = config('AI_FALLBACK_ENABLED', default=True, cast=bool)

# Rate limiting and throttling
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle'
]
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/day',
    'user': '1000/day'
}
