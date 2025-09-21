# Local development settings with PostgreSQL + pgvector

import os
from decouple import config
from .settings import *

# Override database configuration for local PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}

# OpenAI API Key for RAG pipeline
try:
    OPENAI_API_KEY = config('OPENAI_API_KEY')
except Exception:
    raise ValueError(
        "OPENAI_API_KEY not found in environment variables or .env file. "
        "Please set OPENAI_API_KEY in your environment or add it to backend/.env file"
    )

# Debug settings for development
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# Additional logging for RAG development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'apps.resources.rag_pipeline': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

print("Using PostgreSQL + pgvector for local development")