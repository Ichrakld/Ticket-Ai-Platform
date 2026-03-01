from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Role(models.TextChoices):
    UTILISATEUR = 'Utilisateur', 'Utilisateur'
    TECHNICIEN = 'Technicien', 'Technicien'
    ADMIN = 'Admin', 'Admin'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('role', Role.UTILISATEUR)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Uses Argon2 via PASSWORD_HASHERS
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields['role'] = Role.ADMIN
        extra_fields['is_staff'] = True
        extra_fields['is_superuser'] = True
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with RBAC roles.
    Password is hashed via Argon2 (configured in PASSWORD_HASHERS).
    """
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True, db_index=True)
    # password_hash is managed by AbstractBaseUser as 'password' field
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.UTILISATEUR,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'

    def __str__(self):
        return f'{self.email} ({self.role})'

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_technicien(self):
        return self.role == Role.TECHNICIEN