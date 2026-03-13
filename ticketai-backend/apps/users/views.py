from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.audit.utils import log_action
from .models import Role
from .serializers import RegisterSerializer, UserPublicSerializer, CustomTokenObtainPairSerializer
from .throttles import AuthAnonThrottle


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        requested_role = serializer.validated_data.get('role', Role.UTILISATEUR)

        if requested_role != Role.UTILISATEUR:
            if not request.user.is_authenticated or request.user.role != Role.ADMIN:
                return Response(
                    {'success': False, 'error': 'Admin privilege required to assign elevated roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        user = serializer.save()
        log_action(action='USER_REGISTERED', user=user, ip_address=_get_client_ip(request))

        return Response(
            {
                'success': True,
                'message': 'Account created successfully.',
                'user': UserPublicSerializer(user).data,
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    ✅ FIX : utilise CustomTokenObtainPairSerializer qui ajoute
    user: { id, email, role, created_at } dans la réponse.
    """
    throttle_classes = [AuthAnonThrottle]
    serializer_class = CustomTokenObtainPairSerializer  # ← CETTE LIGNE MANQUAIT

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            from .models import User
            try:
                user = User.objects.get(email=request.data.get('email', '').lower())
                log_action(
                    action='USER_LOGIN',
                    user=user,
                    ip_address=_get_client_ip(request),
                )
            except User.DoesNotExist:
                pass

        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'success': False, 'error': 'Refresh token required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_action(action='USER_LOGOUT', user=request.user, ip_address=_get_client_ip(request))
            return Response({'success': True, 'message': 'Logged out successfully.'})
        except Exception:
            return Response(
                {'success': False, 'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')