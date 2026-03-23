"""
Ticket API Views
"""
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.core.validators import validate_json_schema
from .schemas import TICKET_CREATE_SCHEMA
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

logger = logging.getLogger('apps.tickets')
security_logger = logging.getLogger('security')


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


class TicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.info('Ticket list requested | user=%s | ip=%s', user.email, _get_client_ip(request))

        queryset = Ticket.objects.select_related('created_by', 'assigned_to')

        if user.role == Role.UTILISATEUR:
            queryset = queryset.filter(created_by=user, is_archived=False)
        elif user.role == Role.TECHNICIEN:
            queryset = queryset.filter(is_archived=False)

        status_filter   = request.query_params.get('status')
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

            # Pagination
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        page = max(int(request.query_params.get('page', 1)), 1)
        offset = (page - 1) * page_size
        total = queryset.count()
        queryset_page = queryset[offset:offset + page_size]

        serializer = TicketListSerializer(queryset_page, many=True)
        logger.info('Ticket list returned | count=%s | user=%s', total, user.email)

        return Response({
            'success': True,
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'results': serializer.data,
        })

    @validate_json_schema(TICKET_CREATE_SCHEMA)
    def post(self, request):
        ip = _get_client_ip(request)
        logger.info('Ticket creation attempt | user=%s | ip=%s', request.user.email, ip)

        serializer = TicketCreateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(
                'Ticket creation failed validation | user=%s | errors=%s',
                request.user.email, serializer.errors
            )
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        title       = serializer.validated_data['title']
        description = serializer.validated_data['description']

        try:
            ai_result      = analyze_ticket(title=title, description=description)
            category       = ai_result['category']
            priority_score = ai_result['priority_score']
            logger.info('AI classification success | category=%s | priority=%s', category, priority_score)
        except AIServiceError as e:
            logger.error('AI classification failed | user=%s | error=%s', request.user.email, str(e))
            category       = None
            priority_score = None

        ticket = Ticket.objects.create(
            title=title,
            description=description,
            created_by=request.user,
            category=category,
            priority_score=priority_score,
            status=TicketStatus.OUVERT,
        )

        logger.info(
            'Ticket created | id=%s | user=%s | category=%s | priority=%s | ip=%s',
            ticket.id, request.user.email, category, priority_score, ip
        )

        log_action(
            action='TICKET_CREATED',
            user=request.user,
            ticket=ticket,
            ip_address=ip,
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
    permission_classes = [IsAuthenticated]

    def get_object(self, ticket_id, user):
        try:
            ticket = Ticket.objects.select_related('created_by', 'assigned_to').get(pk=ticket_id)
        except Ticket.DoesNotExist:
            logger.warning('Ticket not found | id=%s | user=%s', ticket_id, user.email)
            return None, Response(
                {'success': False, 'error': 'Ressource introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        if user.role == Role.UTILISATEUR and ticket.created_by != user:
            security_logger.warning(
                'IDOR attempt | ticket_id=%s | user=%s | owner=%s',
                ticket_id, user.email, ticket.created_by.email
            )
            return None, Response(
                {'success': False, 'error': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return ticket, None

    def get(self, request, ticket_id):
        logger.info('Ticket detail requested | id=%s | user=%s', ticket_id, request.user.email)
        ticket, error = self.get_object(ticket_id, request.user)
        if error:
            return error
        return Response({'success': True, 'ticket': TicketDetailSerializer(ticket).data})


class TicketStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsTechnicienOrAdmin]

    def patch(self, request, ticket_id):
        ip = _get_client_ip(request)
        try:
            ticket = Ticket.objects.get(pk=ticket_id, is_archived=False)
        except Ticket.DoesNotExist:
            logger.warning('Status update on unknown ticket | id=%s | user=%s', ticket_id, request.user.email)
            return Response(
                {'success': False, 'error': 'Ressource introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.role == Role.TECHNICIEN:
            if ticket.assigned_to and ticket.assigned_to != request.user:
                security_logger.warning(
                    'IDOR attempt on status update | ticket_id=%s | user=%s | assigned_to=%s',
                    ticket_id, request.user.email,
                    ticket.assigned_to.email if ticket.assigned_to else 'none'
                )
                return Response(
                    {'success': False, 'error': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        old_status = ticket.status
        serializer = TicketStatusUpdateSerializer(ticket, data=request.data, partial=True)
        if not serializer.is_valid():
            logger.warning('Status update validation failed | ticket_id=%s | errors=%s', ticket_id, serializer.errors)
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = serializer.validated_data.get('status', old_status)

        save_kwargs = {}
        if new_status == TicketStatus.RESOLU and old_status != TicketStatus.RESOLU:
            save_kwargs['resolved_at'] = timezone.now()
        elif new_status != TicketStatus.RESOLU:
            save_kwargs['resolved_at'] = None

        ticket = serializer.save(**save_kwargs)

        logger.info(
            'Ticket status updated | id=%s | %s→%s | user=%s | ip=%s',
            ticket_id, old_status, new_status, request.user.email, ip
        )

        log_action(
            action=f'TICKET_STATUS_CHANGED:{old_status}→{new_status}',
            user=request.user,
            ticket=ticket,
            ip_address=ip,
        )

        return Response({
            'success': True,
            'message': f'Status updated to {new_status}.',
            'ticket': TicketDetailSerializer(ticket).data,
        })


class TicketAssignView(APIView):
    permission_classes = [IsAuthenticated, IsTechnicienOrAdmin]

    def patch(self, request, ticket_id):
        from apps.users.models import User
        ip = _get_client_ip(request)

        try:
            ticket = Ticket.objects.get(pk=ticket_id, is_archived=False)
        except Ticket.DoesNotExist:
            logger.warning('Assign on unknown ticket | id=%s | user=%s', ticket_id, request.user.email)
            return Response(
                {'success': False, 'error': 'Ressource introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        assignee_id = request.data.get('assigned_to')
        if assignee_id is None:
            ticket.assigned_to = None
            logger.info('Ticket unassigned | id=%s | user=%s | ip=%s', ticket_id, request.user.email, ip)
        else:
            try:
                assignee = User.objects.get(pk=assignee_id, is_active=True)
                if assignee.role not in (Role.TECHNICIEN, Role.ADMIN):
                    logger.warning(
                        'Invalid assignee role | ticket_id=%s | assignee_id=%s | role=%s',
                        ticket_id, assignee_id, assignee.role
                    )
                    return Response(
                        {'success': False, 'error': 'Assignation impossible pour ce rôle.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                ticket.assigned_to = assignee
                logger.info(
                    'Ticket assigned | id=%s | assignee=%s | by=%s | ip=%s',
                    ticket_id, assignee.email, request.user.email, ip
                )
            except User.DoesNotExist:
                logger.warning('Assign to unknown user | assignee_id=%s | ticket_id=%s', assignee_id, ticket_id)
                return Response(
                    {'success': False, 'error': 'Ressource introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        ticket.save(update_fields=['assigned_to'])
        log_action(
            action=f'TICKET_ASSIGNED:user={assignee_id}',
            user=request.user,
            ticket=ticket,
            ip_address=ip,
        )

        return Response({
            'success': True,
            'message': 'Ticket assignment updated.',
            'ticket': TicketDetailSerializer(ticket).data,
        })


class TicketArchiveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, ticket_id):
        ip = _get_client_ip(request)
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            logger.warning('Archive on unknown ticket | id=%s | user=%s', ticket_id, request.user.email)
            return Response(
                {'success': False, 'error': 'Ressource introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        ticket.is_archived = True
        ticket.save(update_fields=['is_archived'])

        logger.info('Ticket archived | id=%s | admin=%s | ip=%s', ticket_id, request.user.email, ip)

        log_action(
            action='TICKET_ARCHIVED',
            user=request.user,
            ticket=ticket,
            ip_address=ip,
        )

        return Response({
            'success': True,
            'message': f'Ticket #{ticket_id} has been archived.',
        })