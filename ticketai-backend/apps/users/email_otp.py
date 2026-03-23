import secrets
import logging
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('security')


def generate_email_otp(user_id: int) -> str:
    """Génère un OTP 6 chiffres et le stocke en cache 10 min."""
    otp = str(secrets.randbelow(900000) + 100000)  # 100000-999999
    cache_key = f'email_otp:{user_id}'
    cache.set(cache_key, otp, timeout=settings.OTP_EXPIRY_MINUTES * 60)
    return otp


def verify_email_otp(user_id: int, token: str) -> bool:
    """Vérifie l'OTP — usage unique, supprimé après vérification."""
    cache_key = f'email_otp:{user_id}'
    stored = cache.get(cache_key)
    if stored and stored == token.strip():
        cache.delete(cache_key)  # Usage unique
        return True
    return False


def send_otp_email(user_email: str, user_id: int, otp: str) -> bool:
    """Envoie l'OTP par email."""
    subject = 'TicketAI — Code de vérification'
    message = f"""
Bonjour,

Votre code de vérification TicketAI est :

    {otp}

Ce code expire dans {settings.OTP_EXPIRY_MINUTES} minutes.
Ne partagez jamais ce code avec personne.

Si vous n'avez pas demandé ce code, ignorez cet email.

— L'équipe TicketAI
    """
    html_message = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #15803d; margin-bottom: 10px;">TicketAI</h2>
        <p style="color: #374151;">Votre code de vérification :</p>
        <div style="background: #ffffff; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #15803d; letter-spacing: 8px;">{otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
            Ce code expire dans <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.
        </p>
        <p style="color: #ef4444; font-size: 12px;">
            Ne partagez jamais ce code avec personne.
        </p>
    </div>
</body>
</html>
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info('OTP_EMAIL_SENT | user_id=%s | email=%s', user_id, user_email)
        return True
    except Exception as e:
        logger.error('OTP_EMAIL_FAILED | user_id=%s | error=%s', user_id, str(e))
        return False