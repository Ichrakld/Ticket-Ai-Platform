from django.urls import path
from .views import (
    TicketListCreateView,
    TicketDetailView,
    TicketStatusUpdateView,
    TicketAssignView,
    TicketArchiveView,
)

urlpatterns = [
    path('', TicketListCreateView.as_view(), name='ticket-list-create'),
    path('<int:ticket_id>/', TicketDetailView.as_view(), name='ticket-detail'),
    path('<int:ticket_id>/status/', TicketStatusUpdateView.as_view(), name='ticket-status'),
    path('<int:ticket_id>/assign/', TicketAssignView.as_view(), name='ticket-assign'),
    path('<int:ticket_id>/archive/', TicketArchiveView.as_view(), name='ticket-archive'),
]