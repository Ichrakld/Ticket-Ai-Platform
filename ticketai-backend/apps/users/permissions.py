from rest_framework.permissions import BasePermission
from .models import Role


class IsAdmin(BasePermission):
    """Allow access only to Admin users."""
    message = 'Admin role required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.ADMIN
        )


class IsTechnicienOrAdmin(BasePermission):
    """Allow access to Technicien or Admin users."""
    message = 'Technicien or Admin role required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in (Role.TECHNICIEN, Role.ADMIN)
        )


class IsOwnerOrTechnicienOrAdmin(BasePermission):
    """Ticket owner can read; Technicien/Admin can do more."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in (Role.TECHNICIEN, Role.ADMIN):
            return True
        # Owner can read their own ticket
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False