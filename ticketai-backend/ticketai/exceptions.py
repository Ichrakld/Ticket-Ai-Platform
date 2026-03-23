import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('apps')
security_logger = logging.getLogger('security')

# Messages génériques exposés à l'utilisateur
# Les détails restent dans les logs, jamais dans la réponse
GENERIC_ERRORS = {
    400: 'Requête invalide.',
    401: 'Identifiants invalides.',
    403: 'Accès refusé.',
    404: 'Ressource introuvable.',
    405: 'Méthode non autorisée.',
    429: 'Trop de requêtes. Réessayez plus tard.',
    500: 'Une erreur interne est survenue.',
}

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # Logger le détail réel de l'erreur (jamais exposé au client)
        if response.status_code >= 500:
            logger.error(
                'Server error | status=%s | detail=%s | view=%s',
                response.status_code,
                response.data,
                context.get('view', 'unknown')
            )
        elif response.status_code == 401:
            security_logger.warning(
                'Unauthorized access | detail=%s',
                response.data
            )
        elif response.status_code == 403:
            security_logger.warning(
                'Forbidden access | detail=%s | view=%s',
                response.data,
                context.get('view', 'unknown')
            )

        # Réponse générique envoyée au client
        generic_message = GENERIC_ERRORS.get(
            response.status_code,
            'Une erreur est survenue.'
        )

        response.data = {
            'success': False,
            'error': generic_message,
            'status_code': response.status_code,
        }

    return response