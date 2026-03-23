from rest_framework import serializers
from .models import Ticket, TicketStatus
from apps.users.serializers import UserPublicSerializer
from apps.core.xss_protection import sanitize_string


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ('title', 'description')

    def validate_title(self, value):
        value = sanitize_string(value)
        if len(value) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters.')
        return value

    def validate_description(self, value):
        value = sanitize_string(value)
        if len(value) < 10:
            raise serializers.ValidationError('Description must be at least 10 characters.')
        return value


class TicketStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ('status', 'assigned_to')

    def validate_status(self, value):
        if value not in TicketStatus.values:
            raise serializers.ValidationError('Invalid status.')
        return value


class TicketListSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)
    assigned_to = UserPublicSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = (
            'id', 'title', 'description', 'status', 'category',
            'priority_score', 'created_by', 'assigned_to',
            'created_at', 'resolved_at', 'is_archived',
        )
        read_only_fields = fields


class TicketDetailSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)
    assigned_to = UserPublicSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = (
            'id', 'title', 'description', 'status', 'category',
            'priority_score', 'created_by', 'assigned_to',
            'created_at', 'resolved_at', 'is_archived',
        )
        read_only_fields = fields