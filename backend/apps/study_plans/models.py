"""
Models for the study_plans app.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


User = get_user_model()


class StudyPlan(models.Model):
    """
    Model representing a study plan for a course.

    Study plans help users organize their learning and track progress.
    """

    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]

    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='study_plans',
        help_text="User who owns this study plan"
    )

    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='study_plans',
        help_text="Course this study plan is for"
    )

    # Basic Information
    title = models.CharField(
        max_length=200,
        help_text="Study plan title"
    )

    description = models.TextField(
        blank=True,
        help_text="Study plan description and goals"
    )

    # Timeline
    start_date = models.DateField(
        help_text="Study plan start date"
    )

    end_date = models.DateField(
        help_text="Study plan end date"
    )

    # Status and Progress
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Current status of the study plan"
    )

    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Progress percentage (0-100)"
    )

    # Plan Data
    plan_data = models.JSONField(
        default=dict,
        help_text="Structured study plan data (topics, schedule, milestones)"
    )

    # Vector Search Support (pgvector-ready) - Disabled for SQLite
    # plan_embedding = ArrayField(
    #     models.FloatField(),
    #     size=1536,  # Standard embedding size for many models
    #     null=True,
    #     blank=True,
    #     help_text="Vector embedding for semantic search (pgvector-ready)"
    # )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'study_plans_studyplan'
        verbose_name = 'Study Plan'
        verbose_name_plural = 'Study Plans'
        ordering = ['-created_at']
        unique_together = ['user', 'course', 'title']

    def __str__(self):
        return f"{self.title} - {self.course.name}"

    @property
    def is_active(self):
        """Check if the study plan is currently active."""
        return self.status == 'active'

    @property
    def is_overdue(self):
        """Check if the study plan is overdue."""
        return (
            self.end_date < timezone.now().date() and
            self.status not in ['completed', 'cancelled']
        )

    @property
    def days_remaining(self):
        """Calculate days remaining until end date."""
        if self.end_date:
            delta = self.end_date - timezone.now().date()
            return delta.days
        return None

    @property
    def duration_days(self):
        """Calculate total duration in days."""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return None

    @property
    def days_elapsed(self):
        """Calculate days elapsed since start date."""
        if self.start_date:
            delta = timezone.now().date() - self.start_date
            return max(0, delta.days)
        return 0

    @property
    def time_progress_percentage(self):
        """Calculate time-based progress percentage."""
        if not self.duration_days or self.duration_days <= 0:
            return 0

        elapsed = self.days_elapsed
        return min(100, (elapsed / self.duration_days) * 100)

    def update_progress(self, new_progress):
        """Update progress percentage and save."""
        if 0 <= new_progress <= 100:
            self.progress_percentage = new_progress

            # Auto-complete if progress reaches 100%
            if new_progress == 100 and self.status != 'completed':
                self.status = 'completed'
                self.save(manual_status_update=True)  # This is a legitimate auto-completion
            else:
                self.save()

    def get_plan_summary(self):
        """Get a summary of the plan data."""
        if not self.plan_data:
            return {}

        return {
            'total_topics': len(self.plan_data.get('topics', [])),
            'total_milestones': len(self.plan_data.get('milestones', [])),
            'estimated_hours': self.plan_data.get('estimated_hours', 0),
            'difficulty_level': self.plan_data.get('difficulty_level', 3),
        }

    def get_upcoming_milestones(self, days_ahead=7):
        """Get milestones due within the next N days."""
        if not self.plan_data or 'milestones' not in self.plan_data:
            return []

        upcoming = []
        cutoff_date = timezone.now().date() + timezone.timedelta(days=days_ahead)

        for milestone in self.plan_data['milestones']:
            if 'due_date' in milestone:
                try:
                    milestone_date = timezone.datetime.strptime(
                        milestone['due_date'], '%Y-%m-%d'
                    ).date()

                    if timezone.now().date() <= milestone_date <= cutoff_date:
                        upcoming.append(milestone)
                except (ValueError, TypeError):
                    continue

        return upcoming

    def save(self, *args, **kwargs):
        """Override save to validate dates and update status."""
        # Validate dates
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("Start date must be before end date")

        # Auto-set status based on dates and progress
        today = timezone.now().date()

        # Check if this is a manual status update (e.g., from activate/pause actions)
        manual_status_update = kwargs.pop('manual_status_update', False)

        if self.status == 'draft':
            pass  # Keep as draft until manually activated
        elif not manual_status_update and self.progress_percentage == 100 and self.status not in ['completed']:
            # Only auto-complete if it's not a manual status change and not already completed
            self.status = 'completed'
        elif self.end_date < today and self.status not in ['completed', 'cancelled']:
            self.status = 'paused'  # Could be considered overdue

        super().save(*args, **kwargs)
