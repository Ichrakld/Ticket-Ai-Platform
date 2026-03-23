from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class AntiEnumerationBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # simplejwt envoie 'email' dans kwargs, pas 'username'
        email = username or kwargs.get('email')
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            User().check_password(password)
        return None