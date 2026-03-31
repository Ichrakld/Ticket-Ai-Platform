import logging
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .throttles import LoginThrottle, RegisterThrottle
from apps.audit.utils import log_action
from .models import Role
from .serializers import RegisterSerializer, UserPublicSerializer, CustomTokenObtainPairSerializer

# ── django-otp imports (remplace pyotp + email_otp) ──
from .otp import (
    generate_totp_secret,
    get_totp_qr,
    verify_totp,
    get_confirmed_totp_device,
    send_email_otp,
    verify_email_otp,
)

logger          = logging.getLogger('apps.users')
security_logger = logging.getLogger('security')


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


# ══════════════════════════════════════════
#  REGISTER
# ══════════════════════════════════════════
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [RegisterThrottle]

    def post(self, request):
        ip = _get_client_ip(request)
        logger.info('Registration attempt | ip=%s', ip)

        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning('Registration validation failed | ip=%s | errors=%s',
                           ip, serializer.errors)
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        requested_role = serializer.validated_data.get('role', Role.UTILISATEUR)
        if requested_role != Role.UTILISATEUR:
            if not request.user.is_authenticated or request.user.role != Role.ADMIN:
                security_logger.warning(
                    'Unauthorized role elevation attempt | role=%s | ip=%s',
                    requested_role, ip
                )
                return Response(
                    {'success': False, 'error': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        user = serializer.save()
        logger.info('User registered | email=%s | role=%s | ip=%s',
                    user.email, user.role, ip)
        log_action(action='USER_REGISTERED', user=user, ip_address=ip)

        return Response(
            {
                'success': True,
                'message': 'Account created successfully.',
                'user': UserPublicSerializer(user).data,
            },
            status=status.HTTP_201_CREATED
        )


# ══════════════════════════════════════════
#  LOGIN
# ══════════════════════════════════════════
class LoginView(TokenObtainPairView):
    throttle_classes  = [LoginThrottle]
    serializer_class  = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        ip    = _get_client_ip(request)
        email = request.data.get('email', 'unknown')
        response = super().post(request, *args, **kwargs)

        if response.status_code == 401:
            security_logger.warning('LOGIN_FAILED | email=%s | ip=%s', email, ip)
            return Response(
                {'error': 'Identifiants invalides.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if response.status_code == 200:
            security_logger.info('LOGIN_SUCCESS | email=%s | ip=%s', email, ip)
            from .models import User
            try:
                user = User.objects.get(email=email.lower())
                log_action(action='USER_LOGIN', user=user, ip_address=ip)
            except User.DoesNotExist:
                pass

        return response


# ══════════════════════════════════════════
#  LOGOUT
# ══════════════════════════════════════════
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip         = _get_client_ip(request)
        logout_all = request.data.get('logout_all', False)

        if logout_all:
            tokens = OutstandingToken.objects.filter(user=request.user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
            security_logger.info('LOGOUT_ALL | user=%s | ip=%s',
                                  request.user.email, ip)
            log_action(action='USER_LOGOUT_ALL', user=request.user, ip_address=ip)
            return Response({'success': True,
                             'message': 'Toutes les sessions invalidées.'})

        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token requis.'}, status=400)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            security_logger.info('LOGOUT | user=%s | ip=%s',
                                  request.user.email, ip)
            log_action(action='USER_LOGOUT', user=request.user, ip_address=ip)
            return Response({'success': True, 'message': 'Déconnecté avec succès.'})
        except Exception:
            security_logger.warning('LOGOUT_FAILED | user=%s | ip=%s',
                                     request.user.email, ip)
            return Response({'error': 'Token invalide ou expiré.'}, status=400)


# ══════════════════════════════════════════
#  ME
# ══════════════════════════════════════════
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


# ══════════════════════════════════════════
#  MFA TOTP — Setup
# ══════════════════════════════════════════
class MFASetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user   = request.user
        device = generate_totp_secret(user)   # crée TOTPDevice django-otp
        data   = get_totp_qr(device)          # génère QR code base64
        logger.info('MFA TOTP setup | user=%s', user.email)
        log_action(action='MFA_SETUP', user=user,
                   ip_address=_get_client_ip(request))
        return Response(data)


# ══════════════════════════════════════════
#  MFA TOTP — Verify & Activate
# ══════════════════════════════════════════
class MFAVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip    = _get_client_ip(request)
        token = request.data.get('token', '').strip()
        user  = request.user

        if not token:
            return Response({'error': 'Code requis.'}, status=400)

        if verify_totp(user, token):
            user.mfa_enabled = True
            user.save(update_fields=['mfa_enabled'])
            security_logger.info('MFA_ENABLED | user=%s | ip=%s', user.email, ip)
            log_action(action='MFA_ENABLED', user=user, ip_address=ip)
            return Response({'success': True, 'message': 'MFA TOTP activé.'})

        security_logger.warning('MFA_VERIFY_FAILED | user=%s | ip=%s',
                                 user.email, ip)
        return Response({'error': 'Code invalide ou expiré.'}, status=400)


# ══════════════════════════════════════════
#  MFA Email OTP — Send
# ══════════════════════════════════════════
class SendEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        ip   = _get_client_ip(request)

        try:
            send_email_otp(user)   # django-otp génère + envoie automatiquement
        except Exception as e:
            logger.error('EMAIL_OTP_ERROR | user=%s | error=%s',
                         user.email, str(e))
            return Response(
                {'success': False, 'error': 'Impossible d\'envoyer l\'email.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        security_logger.info('EMAIL_OTP_SENT | user=%s | ip=%s', user.email, ip)
        log_action(action='EMAIL_OTP_SENT', user=user, ip_address=ip)

        return Response({
            'success': True,
            'message': f'Code envoyé à {user.email}. Valide 10 minutes.',
        })


# ══════════════════════════════════════════
#  MFA Email OTP — Verify
# ══════════════════════════════════════════
class VerifyEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip    = _get_client_ip(request)
        token = request.data.get('token', '').strip()
        user  = request.user

        if not token:
            return Response(
                {'success': False, 'error': 'Code requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verify_email_otp(user, token):
            cache.set(f'mfa_verified:{user.id}', True, timeout=3600)
            security_logger.info('EMAIL_OTP_VERIFIED | user=%s | ip=%s',
                                  user.email, ip)
            log_action(action='EMAIL_OTP_VERIFIED', user=user, ip_address=ip)
            return Response({
                'success': True,
                'message': 'Identité vérifiée avec succès.',
                'mfa_verified': True,
            })

        security_logger.warning('EMAIL_OTP_FAILED | user=%s | ip=%s',
                                 user.email, ip)
        return Response(
            {'success': False, 'error': 'Code invalide ou expiré.'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ══════════════════════════════════════════
#  UPDATE PROFILE / PASSWORD
# ══════════════════════════════════════════
class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        ip   = _get_client_ip(request)

        current_password = request.data.get('current_password')
        new_password     = request.data.get('new_password')

        if not user.check_password(current_password):
            security_logger.warning(
                'PASSWORD_CHANGE_FAILED | user=%s | ip=%s', user.email, ip
            )
            return Response(
                {'success': False, 'error': 'Mot de passe actuel incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'success': False, 'error': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # Invalider tous les tokens après changement de mot de passe
        tokens = OutstandingToken.objects.filter(user=user)
        for t in tokens:
            BlacklistedToken.objects.get_or_create(token=t)

        security_logger.info('PASSWORD_CHANGED | user=%s | ip=%s', user.email, ip)
        log_action(action='PASSWORD_CHANGED', user=user, ip_address=ip)

        return Response({
            'success': True,
            'message': 'Mot de passe mis à jour. Veuillez vous reconnecter.'
        })


# ══════════════════════════════════════════
#  USER LIST — Admin only
# ══════════════════════════════════════════
class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != Role.ADMIN:
            return Response(
                {'success': False, 'error': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from .models import User
        users = User.objects.all().order_by('-created_at')

        role_filter = request.query_params.get('role')
        if role_filter:
            users = users.filter(role=role_filter)

        serializer = UserPublicSerializer(users, many=True)
        logger.info('User list accessed | admin=%s', request.user.email)

        return Response({
            'success': True,
            'count': users.count(),
            'results': serializer.data,
        })