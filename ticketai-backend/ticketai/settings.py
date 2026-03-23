"""
TicketAI Django Settings
"""
from datetime import timedelta
from decouple import config
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',      # Required for the admin panel
    'django.contrib.auth',       # CRITICAL for your Custom User model
    'django.contrib.contenttypes',
    'django.contrib.sessions',   # Required by auth and admin
    'django.contrib.messages',   # Required by admin
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_ratelimit',
    'apps.users',
    'apps.tickets',
    'apps.audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'apps.core.middleware.RequestSizeLimitMiddleware', 
    'apps.core.middleware.RequestLoggingMiddleware',
    'apps.core.sql_guard.SQLInjectionMiddleware',        # ← nouveau
    'apps.core.xss_protection.XSSProtectionMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',    # <--- ADDED
    'django.middleware.common.CommonMiddleware',
    'apps.core.csrf.CustomCsrfMiddleware', 
    'django.contrib.auth.middleware.AuthenticationMiddleware', # <--- ADDED
    'django.contrib.messages.middleware.MessageMiddleware',    # <--- ADDED
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ticketai.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',        # <--- ADDED
                'django.contrib.messages.context_processors.messages',  # <--- ADDED
            ],
        },
    },
]

WSGI_APPLICATION = 'ticketai.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            # Parameterized queries are enforced by Django ORM by default
            'sql_mode': 'STRICT_TRANS_TABLES',
        },
    }
}

# Password hashers - Argon2 first (most secure)
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]
# Ajouter dans settings.py
ARGON2_PARAMS = {
    'time_cost': 2,
    'memory_cost': 102400,   # 100 MB
    'parallelism': 8,
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/hour',
        'user': '200/hour',
        'auth': '5/minute',  
        'auth_user': '10/minute',    # déjà là
        'login': '5/minute',         # nouveau
        'register': '3/minute',      # nouveau
        'password_reset': '3/hour',  # nouveau    # Tight limit on login/register
    },
    'EXCEPTION_HANDLER': 'ticketai.exceptions.custom_exception_handler',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=15, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=1, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'TOKEN_OBTAIN_SERIALIZER': 'apps.users.serializers.CustomTokenObtainPairSerializer',
}

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True
# CSRF ← nouveau
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3000'
).split(',')
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SECURE = True 
CSRF_COOKIE_SAMESITE = 'Lax'
# AI Microservice
AI_SERVICE_URL = config('AI_SERVICE_URL', default='http://localhost:8001/analyze')
AI_SERVICE_TIMEOUT = config('AI_SERVICE_TIMEOUT', default=10, cast=int)

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'
# Cache configuration for django-ratelimit
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'ticketai-local-cache',
    }
}

# Silence django-ratelimit's strict production cache warnings during local dev
SILENCED_SYSTEM_CHECKS = ['django_ratelimit.E003', 'django_ratelimit.W001']

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 12}},  # Passer de 8 à 12
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    {'NAME': 'apps.users.validators.StrongPasswordValidator'},
]
AUTHENTICATION_BACKENDS = [
    'apps.users.backends.AntiEnumerationBackend',
]
# Seulement en production (DEBUG=False)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Taille maximale du body des requêtes
DATA_UPLOAD_MAX_MEMORY_SIZE = 1 * 1024 * 1024   # 1 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 1 * 1024 * 1024   # 1 MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 20               # Max 20 champs par requête


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,

    'formatters': {
        'detailed': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },

    'handlers': {
        # Logs dans la console (développement)
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'detailed',
        },
        # Logs généraux dans un fichier
        'file_general': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'general.log'),
            'maxBytes': 5 * 1024 * 1024,  # 5 MB
            'backupCount': 5,
            'formatter': 'detailed',
        },
        # Logs de sécurité dans un fichier séparé
        'file_security': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'security.log'),
            'maxBytes': 5 * 1024 * 1024,
            'backupCount': 10,
            'formatter': 'detailed',
        },
        # Logs d'erreurs critiques
        'file_errors': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'errors.log'),
            'maxBytes': 5 * 1024 * 1024,
            'backupCount': 10,
            'formatter': 'detailed',
            'level': 'ERROR',
        },
    },

    'loggers': {
        # Logger Django général
        'django': {
            'handlers': ['console', 'file_general'],
            'level': 'INFO',
            'propagate': False,
        },
        # Logger requêtes Django
        'django.request': {
            'handlers': ['file_errors', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        # Logger sécurité
        'security': {
            'handlers': ['file_security', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        # Logger de votre application
        'apps': {
            'handlers': ['console', 'file_general', 'file_errors'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Créer le dossier logs automatiquement
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

AI_SERVICE_URL = config('AI_SERVICE_URL', default='http://localhost:5000/predict')
AI_SERVICE_TIMEOUT = config('AI_SERVICE_TIMEOUT', default=10, cast=int)
AI_SECRET_KEY = config('AI_SECRET_KEY', default='ticketai-secret-2024-neural')  # ← nouveau

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('EMAIL_HOST_USER')

# OTP expiration en minutes
OTP_EXPIRY_MINUTES = 10