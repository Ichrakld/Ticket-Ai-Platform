from django.db import models
from django.conf import settings
from django.utils import timezone


class TicketStatus(models.TextChoices):
    OUVERT = 'Ouvert', 'Ouvert'
    EN_COURS = 'En cours', 'En cours'
    RESOLU = 'Résolu', 'Résolu'
    FERME = 'Fermé', 'Fermé'


class TicketCategory(models.TextChoices):
    COMPTE_BLOQUE = 'Compte bloqué', 'Compte bloqué'
    SALLE_EQUIPEMENT = 'Salle / Équipement', 'Salle / Équipement'
    MATERIEL_INFO = 'Matériel informatique', 'Matériel informatique'
    TELECOMMANDE_CLIM = 'Télécommandes de climatiseur', 'Télécommandes de climatiseur'


class PriorityScore(models.TextChoices):
    FAIBLE = 'Faible', 'Faible'
    MOYEN = 'Moyen', 'Moyen'
    ELEVE = 'Élevé', 'Élevé'
    CRITIQUE = 'Critique', 'Critique'


class Ticket(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OUVERT,
        db_index=True,
    )
    category = models.CharField(
        max_length=50,
        choices=TicketCategory.choices,
        null=True,
        blank=True,
        db_index=True,
    )
    priority_score = models.CharField(
        max_length=10,
        choices=PriorityScore.choices,
        null=True,
        blank=True,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_tickets',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority_score']),
            models.Index(fields=['created_by', 'status']),
        ]

    def __str__(self):
        return f'[{self.id}] {self.title} — {self.status}'