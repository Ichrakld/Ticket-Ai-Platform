from django.middleware.csrf import CsrfViewMiddleware
from django.http import JsonResponse


class CustomCsrfMiddleware(CsrfViewMiddleware):
    """
    CSRF middleware personnalisé qui retourne du JSON
    au lieu de la page HTML Django par défaut.
    """
    def process_view(self, request, callback, callback_args, callback_kwargs):
        result = super().process_view(request, callback, callback_args, callback_kwargs)
        if result is not None:
            return JsonResponse(
                {'success': False, 'error': 'CSRF token invalide ou manquant.'},
                status=403
            )
        return result