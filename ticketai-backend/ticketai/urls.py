from django.urls import path, include

urlpatterns = [
    path('api/auth/', include('apps.users.urls')),
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/audit/', include('apps.audit.urls')),
]