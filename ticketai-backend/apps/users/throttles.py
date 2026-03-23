from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthAnonThrottle(AnonRateThrottle):
    """5 requests/minute for anonymous auth endpoints."""
    scope = 'auth'


class AuthUserThrottle(UserRateThrottle):
    """10 requests/minute for authenticated auth endpoints."""
    scope = 'auth_user'
    rate = '10/minute'


# --- Ajouts ---

class LoginThrottle(AnonRateThrottle):
    """5 tentatives/minute par IP pour le login."""
    scope = 'login'


class RegisterThrottle(AnonRateThrottle):
    """3 inscriptions/minute par IP."""
    scope = 'register'


class PasswordResetThrottle(AnonRateThrottle):
    """3 demandes de reset/heure par IP."""
    scope = 'password_reset'