# apps/users/otp.py
import io
import base64
import logging
import qrcode
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.plugins.otp_email.models import EmailDevice

logger = logging.getLogger('security')


# ══════════════════════════════════════════
#  TOTP — Google Authenticator
# ══════════════════════════════════════════

def generate_totp_secret(user):
    """Crée un nouveau TOTPDevice non confirmé pour l'utilisateur."""
    TOTPDevice.objects.filter(user=user, confirmed=False).delete()
    device = TOTPDevice.objects.create(
        user=user,
        name=f'TicketAI-{user.email}',
        confirmed=False
    )
    return device


def get_totp_uri(device, email):
    """Retourne l'URI otpauth:// pour le QR code."""
    return device.config_url


def get_totp_qr(device):
    """Génère le QR code en base64 PNG."""
    uri = device.config_url
    qr  = qrcode.make(uri)
    buf = io.BytesIO()
    qr.save(buf, format='PNG')
    return {
        'otpauth_url': uri,
        'qr_code': f'data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}',
    }


def verify_totp(user, token: str) -> bool:
    """Vérifie le code TOTP et confirme le device si valide."""
    device = TOTPDevice.objects.filter(user=user).first()
    if not device:
        return False
    if device.verify_token(token):
        if not device.confirmed:
            device.confirmed = True
            device.save()
        return True
    return False


def get_confirmed_totp_device(user):
    """Retourne le device TOTP confirmé ou None."""
    return TOTPDevice.objects.filter(user=user, confirmed=True).first()


# ══════════════════════════════════════════
#  OTP Email — 100% django-otp
# ══════════════════════════════════════════

def setup_email_device(user):
    """Crée ou récupère un EmailDevice confirmé pour l'utilisateur."""
    device, created = EmailDevice.objects.get_or_create(
        user=user,
        name=f'email-{user.email}',
        defaults={
            'confirmed': True,
            'email': user.email,
        }
    )
    if not created:
        device.email = user.email
        device.save()
    return device


def send_email_otp(user) -> bool:
    """Génère et envoie l'OTP via django-otp EmailDevice."""
    device = setup_email_device(user)
    try:
        device.generate_challenge()
        logger.info('EMAIL_OTP_SENT | user=%s', user.email)
        return True
    except Exception as e:
        logger.error('EMAIL_OTP_SEND_ERROR | user=%s | error=%s',
                     user.email, str(e))
        return False


def verify_email_otp(user, token: str) -> bool:
    """Vérifie le code OTP email via django-otp — usage unique."""
    device = EmailDevice.objects.filter(
        user=user,
        confirmed=True
    ).first()
    if not device:
        logger.warning('EMAIL_OTP_NO_DEVICE | user=%s', user.email)
        return False
    result = device.verify_token(token)
    if result:
        logger.info('EMAIL_OTP_VERIFIED | user=%s', user.email)
    else:
        logger.warning('EMAIL_OTP_FAILED | user=%s', user.email)
    return result