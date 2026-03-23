from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, LogoutView, MeView
from .views import MFASetupView, MFAVerifyView
from .views import RegisterView, LoginView, LogoutView, MeView, MFASetupView, MFAVerifyView, UpdateProfileView, UserListView,SendEmailOTPView, VerifyEmailOTPView
urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('refresh', TokenRefreshView.as_view(), name='token-refresh'),
    path('me', MeView.as_view(), name='me'),
    path('me/update', UpdateProfileView.as_view(), name='update-profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('mfa/setup', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify', MFAVerifyView.as_view(), name='mfa-verify'),
    path('mfa/email/send', SendEmailOTPView.as_view(), name='mfa-email-send'),      # ← nouveau
    path('mfa/email/verify', VerifyEmailOTPView.as_view(), name='mfa-email-verify'), # ← nouveau
]