import pyotp
import base64
from django.core.cache import cache
from django.conf import settings

def generate_totp_secret():
    return pyotp.random_base32()

def verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)  # ±30 sec

def get_totp_uri(secret: str, email: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="TicketAI")

# OTP email (6 chiffres, expire en 10 min)
def generate_email_otp(user_id: int) -> str:
    import secrets
    otp = str(secrets.randbelow(900000) + 100000)
    cache.set(f'otp:{user_id}', otp, timeout=600)  # 10 min
    return otp

def verify_email_otp(user_id: int, token: str) -> bool:
    stored = cache.get(f'otp:{user_id}')
    if stored and stored == token:
        cache.delete(f'otp:{user_id}')  # Usage unique
        return True
    return False