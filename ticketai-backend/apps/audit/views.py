"""
GET /api/audit/logs/ — Admin only — paginated audit log
"""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.users.permissions import IsAdmin
from apps.audit.utils import log_action
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(APIView):
    """
    GET /api/audit/logs/
    Admin access only. Logs the access itself.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        def _get_ip(req):
            xff = req.META.get('HTTP_X_FORWARDED_FOR')
            return xff.split(',')[0].strip() if xff else req.META.get('REMOTE_ADDR')

        log_action(
            action='ADMIN_AUDIT_LOG_ACCESS',
            user=request.user,
            ip_address=_get_ip(request),
        )

        queryset = AuditLog.objects.select_related('user', 'target_ticket')

        # Filters
        action_filter = request.query_params.get('action')
        user_filter = request.query_params.get('user_id')
        ticket_filter = request.query_params.get('ticket_id')

        if action_filter:
            queryset = queryset.filter(action__icontains=action_filter)
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)
        if ticket_filter:
            queryset = queryset.filter(target_ticket_id=ticket_filter)

        # Simple pagination
        page_size = min(int(request.query_params.get('page_size', 50)), 200)
        page = max(int(request.query_params.get('page', 1)), 1)
        offset = (page - 1) * page_size
        total = queryset.count()
        queryset = queryset[offset:offset + page_size]

        serializer = AuditLogSerializer(queryset, many=True)
        return Response({
            'success': True,
            'total': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })