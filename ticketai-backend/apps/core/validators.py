import jsonschema
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def validate_json_schema(schema):
    """
    Décorateur qui valide le body JSON d'une requête
    contre un schéma JSON Schema.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            try:
                jsonschema.validate(
                    instance=request.data,
                    schema=schema
                )
            except jsonschema.ValidationError as e:
                return Response(
                    {
                        'success': False,
                        'error': 'Données invalides.',
                        'detail': e.message
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            except jsonschema.SchemaError as e:
                return Response(
                    {'success': False, 'error': 'Erreur de schéma interne.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator