import html
import re
import logging

logger = logging.getLogger('security')

# Tags HTML dangereux
DANGEROUS_TAGS = re.compile(
    r'<\s*(script|iframe|object|embed|form|input|link|meta|style|svg|img)'
    r'[^>]*>|javascript\s*:|on\w+\s*=',
    re.IGNORECASE
)


def sanitize_string(value: str) -> str:
    """Échappe les entités HTML et supprime les tags dangereux."""
    if not isinstance(value, str):
        return value
    # Supprimer les tags dangereux
    value = DANGEROUS_TAGS.sub('', value)
    # quote=False → ne pas échapper les apostrophes ' et "
    value = html.escape(value.strip(), quote=False)
    return value

def sanitize_dict(data: dict) -> dict:
    """Sanitise récursivement tous les champs string d'un dict."""
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_string(value)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value)
        elif isinstance(value, list):
            result[key] = [
                sanitize_string(v) if isinstance(v, str) else v
                for v in value
            ]
        else:
            result[key] = value
    return result


class XSSProtectionMiddleware:
    """
    Middleware qui sanitise automatiquement
    tous les champs string des requêtes JSON entrantes.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.content_type == 'application/json' and request.body:
            try:
                import json
                data = json.loads(request.body)
                if isinstance(data, dict):
                    sanitized = sanitize_dict(data)
                    # Détecter si des modifications ont été faites
                    if sanitized != data:
                        logger.warning(
                            'XSS_ATTEMPT_DETECTED | path=%s | ip=%s',
                            request.path,
                            self._get_ip(request)
                        )
                    request._xss_sanitized_data = sanitized
            except (json.JSONDecodeError, Exception):
                pass
        return None

    def _get_ip(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', '0.0.0.0')