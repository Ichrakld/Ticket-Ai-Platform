"""
Convenience helper to create audit log entries from anywhere in the codebase.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def log_action(
    action: str,
    user=None,
    ticket=None,
    ip_address: Optional[str] = None,
    extra: Optional[dict] = None,
) -> None:
    """
    Create an AuditLog record. Fails silently to avoid breaking main flow.

    Args:
        action: Short action string, e.g. 'USER_LOGIN', 'TICKET_STATUS_CHANGED'
        user: User instance (optional)
        ticket: Ticket instance (optional)
        ip_address: Client IP string
        extra: Any additional JSON-serializable context
    """
    try:
        from .models import AuditLog
        AuditLog(
            action=action[:100],
            user=user,
            target_ticket=ticket,
            ip_address=ip_address,
            extra=extra,
        ).save()
    except Exception as e:
        logger.error('Failed to write audit log [%s]: %s', action, str(e))