from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    ticket_id = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id', 'action', 'user_email', 'ticket_id',
            'ip_address', 'extra', 'timestamp',
        )

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_ticket_id(self, obj):
        return obj.target_ticket_id