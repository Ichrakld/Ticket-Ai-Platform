"""
Ticket API Views
- POST   /api/tickets/          — Create ticket (all authenticated users)
- GET    /api/tickets/          — List tickets (filtered by role)
- GET    /api/tickets/<id>/     — Ticket detail
- PATCH  /api/tickets/<id>/status/ — Update status (Technicien/Admin)
- PATCH  /api/tickets/<id>/assign/ — Assign ticket (Technicien/Admin)
- POST   /api/tickets/<id>/archive/ — Archive ticket (Admin)
"""
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import Role
from apps.users.permissions import IsTechnicienOrAdmin, IsAdmin
from apps.audit.utils import log_action
from .models import Ticket, TicketStatus
from .serializers import (
    TicketCreateSerializer,
    TicketListSerializer,
    TicketDetailSerializer,
    TicketStatusUpdateSerializer,
)
from .ai_client import analyze_ticket, AIServiceError

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


class TicketListCreateView(APIView):
    """
    GET  /api/tickets/  — List tickets
    POST /api/tickets/  — Create ticket + AI classification
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Ticket.objects.select_related('created_by', 'assigned_to')

        # Role-based filtering: Utilisateurs see only their own tickets
        if user.role == Role.UTILISATEUR:
            queryset = queryset.filter(created_by=user, is_archived=False)
        elif user.role == Role.TECHNICIEN:
            queryset = queryset.filter(is_archived=False)
        else:
            # Admin sees everything including archived
            pass

        # Query param filters
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority_score')
        category_filter = request.query_params.get('category')
        archived_filter = request.query_params.get('archived', 'false')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority_score=priority_filter)
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        if user.role == Role.ADMIN and archived_filter.lower() == 'true':
            queryset = queryset.filter(is_archived=True)
        elif user.role != Role.ADMIN:
            queryset = queryset.filter(is_archived=False)

        serializer = TicketListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'results': serializer.data,
        })

    def post(self, request):
        """
        1. Validate input
        2. Call AI microservice → get category + priority_score
        3. Save ticket with AI classifications
        4. Log action
        """
        serializer = TicketCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        title = serializer.validated_data['title']
        description = serializer.validated_data['description']

        # ── AI Microservice Call ──────────────────────────────────────────
        try:
            ai_result = analyze_ticket(title=title, description=description)
            category = ai_result['category']
            priority_score = ai_result['priority_score']
        except AIServiceError as e:
            logger.error('AI classification failed: %s', str(e))
            # Graceful degradation: save ticket without AI classification
            category = None
            priority_score = None
        # ─────────────────────────────────────────────────────────────────

        ticket = Ticket.objects.create(
            title=title,
            description=description,
            created_by=request.user,
            category=category,
            priority_score=priority_score,
            status=TicketStatus.OUVERT,
        )

        log_action(
            action='TICKET_CREATED',
            user=request.user,
            ticket=ticket,
            ip_address=_get_client_ip(request),
        )

        return Response(
            {
                'success': True,
                'message': 'Ticket created and classified by AI.',
                'ticket': TicketDetailSerializer(ticket).data,
            },
            status=status.HTTP_201_CREATED
        )


class TicketDetailView(APIView):
    """GET /api/tickets/<id>/"""
    permission_classes = [IsAuthenticated]

    def get_object(self, ticket_id, user):
        try:
            ticket = Ticket.objects.select_related('created_by', 'assigned_to').get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return None, Response(
                {'success': False, 'error': 'Ticket not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Utilisateurs can only view their own tickets
        if user.role == Role.UTILISATEUR and ticket.created_by != user:
            return None, Response(
                {'success': False, 'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return ticket, None

    def get(self, request, ticket_id):
        ticket, error = self.get_object(ticket_id, request.user)
        if error:
            return error
        return Response({'success': True, 'ticket': TicketDetailSerializer(ticket).data})


class TicketStatusUpdateView(APIView):
    """
    PATCH /api/tickets/<id>/status/
    Technicien or Admin only.
    """
    permission_classes = [IsAuthenticated, IsTechnicienOrAdmin]

    def patch(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(pk=ticket_id, is_archived=False)
        except Ticket.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Ticket not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        old_status = ticket.status
        serializer = TicketStatusUpdateSerializer(ticket, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = serializer.validated_data.get('status', old_status)

        # Prepare additional fields to save
        save_kwargs = {}
        if new_status == TicketStatus.RESOLU and old_status != TicketStatus.RESOLU:
            save_kwargs['resolved_at'] = timezone.now()
        elif new_status != TicketStatus.RESOLU:
            save_kwargs['resolved_at'] = None

        # Pass them directly into the save method
        ticket = serializer.save(**save_kwargs)

        log_action(
            action=f'TICKET_STATUS_CHANGED:{old_status}→{new_status}',
            user=request.user,
            ticket=ticket,
            ip_address=_get_client_ip(request),
        )

        return Response({
            'success': True,
            'message': f'Status updated to {new_status}.',
            'ticket': TicketDetailSerializer(ticket).data,
        })


class TicketAssignView(APIView):
    """
    PATCH /api/tickets/<id>/assign/
    Technicien or Admin only.
    """
    permission_classes = [IsAuthenticated, IsTechnicienOrAdmin]

    def patch(self, request, ticket_id):
        from apps.users.models import User
        try:
            ticket = Ticket.objects.get(pk=ticket_id, is_archived=False)
        except Ticket.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Ticket not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        assignee_id = request.data.get('assigned_to')
        if assignee_id is None:
            ticket.assigned_to = None
        else:
            try:
                assignee = User.objects.get(pk=assignee_id, is_active=True)
                if assignee.role not in (Role.TECHNICIEN, Role.ADMIN):
                    return Response(
                        {'success': False, 'error': 'Can only assign to Technicien or Admin.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                ticket.assigned_to = assignee
            except User.DoesNotExist:
                return Response(
                    {'success': False, 'error': 'User not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        ticket.save(update_fields=['assigned_to'])

        log_action(
            action=f'TICKET_ASSIGNED:user={assignee_id}',
            user=request.user,
            ticket=ticket,
            ip_address=_get_client_ip(request),
        )

        return Response({
            'success': True,
            'message': 'Ticket assignment updated.',
            'ticket': TicketDetailSerializer(ticket).data,
        })


class TicketArchiveView(APIView):
    """
    POST /api/tickets/<id>/archive/
    Admin only.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Ticket not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        ticket.is_archived = True
        ticket.save(update_fields=['is_archived'])

        log_action(
            action='TICKET_ARCHIVED',
            user=request.user,
            ticket=ticket,
            ip_address=_get_client_ip(request),
        )

        return Response({
            'success': True,
            'message': f'Ticket #{ticket_id} has been archived.',
        })