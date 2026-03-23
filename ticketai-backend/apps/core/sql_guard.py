import re
import logging

logger = logging.getLogger('security')

# Patterns SQL suspects
SQL_PATTERNS = [
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bDROP\b.*\bTABLE\b)",
    r"(\bINSERT\b.*\bINTO\b)",
    r"(\bDELETE\b.*\bFROM\b)",
    r"(--\s*$)",
    r"(;\s*DROP)",
    r"(\bOR\b\s+\d+\s*=\s*\d+)",
    r"(\bAND\b\s+\d+\s*=\s*\d+)",
    r"('(\s)*OR(\s)*'1'(\s)*=(\s)*'1)",
]

COMPILED = [re.compile(p, re.IGNORECASE) for p in SQL_PATTERNS]


def contains_sql_injection(value: str) -> bool:
    """Détecte les tentatives d'injection SQL dans une chaîne."""
    for pattern in COMPILED:
        if pattern.search(value):
            return True
    return False


class SQLInjectionMiddleware:
    """
    Middleware qui analyse les paramètres GET/POST
    pour détecter les tentatives d'injection SQL.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Vérifier les paramètres GET
        for key, value in request.GET.items():
            if contains_sql_injection(value):
                logger.warning(
                    'SQL_INJECTION_ATTEMPT | param=%s | value=%s | ip=%s | path=%s',
                    key, value[:100],
                    self._get_ip(request),
                    request.path
                )
                from django.http import JsonResponse
                return JsonResponse(
                    {'success': False, 'error': 'Requête invalide.'},
                    status=400
                )

        return self.get_response(request)

    def _get_ip(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', '0.0.0.0')