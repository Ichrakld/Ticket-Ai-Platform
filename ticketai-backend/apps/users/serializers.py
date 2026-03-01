import html
import re
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Role


def sanitize_string(value: str) -> str:
    """Escape HTML entities to prevent XSS."""
    return html.escape(value.strip()) if value else value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, min_length=8
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'role')
        extra_kwargs = {
            'role': {'required': False},
        }

    def validate_email(self, value):
        value = sanitize_string(value.lower())
        if not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', value):
            raise serializers.ValidationError('Invalid email format.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_role(self, value):
        # Only admins can assign Admin role — enforced in view
        if value not in Role.values:
            raise serializers.ValidationError('Invalid role.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'created_at')
        read_only_fields = fields


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user info to the JWT response payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserPublicSerializer(self.user).data
        return data