from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthAnonThrottle(AnonRateThrottle):
    """5 requests/minute for anonymous auth endpoints."""
    scope = 'auth'


class AuthUserThrottle(UserRateThrottle):
    """10 requests/minute for authenticated auth endpoints."""
    scope = 'auth_user'
    rate = '10/minute'