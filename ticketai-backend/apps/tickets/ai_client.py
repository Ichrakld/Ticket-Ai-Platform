"""
AI Microservice HTTP client.
Sends ticket text to the AI service and returns category + priority_score.
"""
import logging
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    pass


def analyze_ticket(title: str, description: str) -> dict:
    """
    POST to AI microservice with ticket text.

    Expected response from AI service:
    {
        "category": "Compte bloqué",
        "priority_score": "Élevé"
    }

    Returns dict with 'category' and 'priority_score', or raises AIServiceError.
    """
    payload = {
        'title': title,
        'description': description,
        'text': f'{title}\n\n{description}',
    }

    try:
        with httpx.Client(timeout=settings.AI_SERVICE_TIMEOUT) as client:
            response = client.post(settings.AI_SERVICE_URL, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        logger.warning('AI service timeout for ticket: %s', title)
        raise AIServiceError('AI service timed out.')
    except httpx.HTTPStatusError as e:
        logger.error('AI service HTTP error: %s', e)
        raise AIServiceError(f'AI service returned {e.response.status_code}.')
    except httpx.RequestError as e:
        logger.error('AI service connection error: %s', e)
        raise AIServiceError('Could not connect to AI service.')
    except ValueError:
        raise AIServiceError('AI service returned invalid JSON.')

    category = data.get('category')
    priority_score = data.get('priority_score')

    if not category or not priority_score:
        raise AIServiceError('AI service response missing category or priority_score.')

    return {
        'category': category,
        'priority_score': priority_score,
    }