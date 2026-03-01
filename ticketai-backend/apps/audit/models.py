from django.db import models
from django.conf import settings
from django.utils import timezone


class AuditLog(models.Model):
    """
    Immutable audit trail for all sensitive actions.
    Never update or delete records — append-only.
    """
    id = models.BigAutoField(primary_key=True)
    action = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        db_index=True,
    )
    target_ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    extra = models.JSONField(null=True, blank=True)  # Additional context
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        # Prevent accidental modification
        default_permissions = ('view',)

    def __str__(self):
        return f'[{self.timestamp:%Y-%m-%d %H:%M}] {self.action} — {self.user}'

    def save(self, *args, **kwargs):
        # Prevent updates to existing records (append-only)
        if self.pk:
            raise PermissionError('AuditLog records are immutable.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('AuditLog records cannot be deleted.')