"""
User models for the Study Bud application.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    Additional fields for study preferences and academic information.
    """

    # Academic Information
    year_of_study = models.IntegerField(
        null=True,
        blank=True,
        help_text="Current year of study (1, 2, 3, 4, etc.)"
    )

    major = models.CharField(
        max_length=100,
        blank=True,
        help_text="Academic major/field of study"
    )

    # User Preferences
    timezone = models.CharField(
        max_length=50,
        default='UTC',
        help_text="User's preferred timezone"
    )

    study_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON object storing user study preferences and settings"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.username

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name or self.username

    def get_display_name(self):
        """Return the best available name for display purposes."""
        return self.get_full_name()

    @property
    def is_academic_info_complete(self):
        """Check if user has completed their academic information."""
        return bool(self.year_of_study and self.major)
