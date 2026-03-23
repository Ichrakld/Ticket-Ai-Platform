from django.http import JsonResponse
import logging
import time

class RequestSizeLimitMiddleware:
    """
    Bloque les requêtes dont le body dépasse MAX_SIZE octets.
    Retourne 413 Request Entity Too Large.
    """
    MAX_SIZE = 1 * 1024 * 1024  # 1 MB

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        content_length = request.META.get('CONTENT_LENGTH')
        if content_length:
            try:
                if int(content_length) > self.MAX_SIZE:
                    return JsonResponse(
                        {
                            'success': False,
                            'error': 'Requête trop volumineuse. Maximum 1 MB.',
                        },
                        status=413
                    )
            except (ValueError, TypeError):
                pass

        return self.get_response(request)

request_logger = logging.getLogger('apps')

class RequestLoggingMiddleware:
    """Log chaque requête avec méthode, path, status et durée."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = round((time.time() - start) * 1000, 2)

        # Ne pas logger les assets statiques
        if not request.path.startswith('/static/'):
            user = getattr(request, 'user', None)
            email = user.email if user and user.is_authenticated else 'anonymous'

            request_logger.info(
                '%s %s | status=%s | user=%s | ip=%s | duration=%sms',
                request.method,
                request.path,
                response.status_code,
                email,
                self._get_ip(request),
                duration,
            )

        return response

    def _get_ip(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', '0.0.0.0')