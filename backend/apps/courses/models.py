"""
Models for the courses app.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


User = get_user_model()


class Course(models.Model):
    """
    Model representing an academic course.
    """

    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='courses',
        help_text="User who owns this course"
    )

    # Basic Information
    name = models.CharField(
        max_length=200,
        help_text="Course name"
    )

    code = models.CharField(
        max_length=20,
        blank=True,
        help_text="Course code (e.g., CS101, MATH201)"
    )

    description = models.TextField(
        blank=True,
        help_text="Course description"
    )

    instructor = models.CharField(
        max_length=100,
        blank=True,
        help_text="Instructor name"
    )

    credits = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Number of credit hours"
    )

    semester = models.CharField(
        max_length=50,
        blank=True,
        help_text="Semester (e.g., Fall 2024, Spring 2025)"
    )

    # Schedule Information
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Course start date"
    )

    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Course end date"
    )

    class_schedule = models.JSONField(
        default=dict,
        blank=True,
        help_text="Class schedule information (days, times, location)"
    )

    # Course Content
    syllabus_text = models.TextField(
        blank=True,
        help_text="Syllabus or course content text"
    )

    # Metadata
    difficulty_level = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Difficulty level from 1 (easy) to 5 (very hard)"
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Whether the course is currently active"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses_course'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['-created_at']
        unique_together = ['user', 'name', 'semester']

    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name

    @property
    def assignment_count(self):
        """Return the number of assignments for this course."""
        return self.assignments.count()

    @property
    def completed_assignment_count(self):
        """Return the number of completed assignments."""
        return self.assignments.filter(status='completed').count()

    @property
    def progress_percentage(self):
        """Calculate course progress based on completed assignments."""
        total = self.assignment_count
        if total == 0:
            return 0
        completed = self.completed_assignment_count
        return round((completed / total) * 100, 2)


class Assignment(models.Model):
    """
    Model representing a course assignment or task.
    """

    # Assignment Types
    ASSIGNMENT_TYPE_CHOICES = [
        ('homework', 'Homework'),
        ('quiz', 'Quiz'),
        ('exam', 'Exam'),
        ('project', 'Project'),
        ('lab', 'Lab'),
        ('essay', 'Essay'),
        ('presentation', 'Presentation'),
        ('discussion', 'Discussion'),
        ('other', 'Other'),
    ]

    # Assignment Status
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]

    # Relationships
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text="Course this assignment belongs to"
    )

    # Basic Information
    title = models.CharField(
        max_length=200,
        help_text="Assignment title"
    )

    assignment_type = models.CharField(
        max_length=20,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='homework',
        help_text="Type of assignment"
    )

    description = models.TextField(
        blank=True,
        help_text="Assignment description or instructions"
    )

    # Scheduling
    due_date = models.DateTimeField(
        help_text="Assignment due date and time"
    )

    estimated_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.1)],
        help_text="Estimated hours to complete"
    )

    # Grading
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Assignment weight in final grade (percentage)"
    )

    grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Grade received (percentage)"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        help_text="Current status of the assignment"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses_assignment'
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} - {self.course.name}"

    @property
    def is_overdue(self):
        """Check if the assignment is overdue."""
        return (
            self.due_date < timezone.now() and
            self.status not in ['completed', 'submitted']
        )

    @property
    def days_until_due(self):
        """Return the number of days until the assignment is due."""
        if self.due_date:
            delta = self.due_date.date() - timezone.now().date()
            return delta.days
        return None

    @property
    def time_until_due(self):
        """Return time until due as a human-readable string."""
        if not self.due_date:
            return None

        delta = self.due_date - timezone.now()

        if delta.total_seconds() < 0:
            return "Overdue"

        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)

        if days > 0:
            return f"{days} days, {hours} hours"
        elif hours > 0:
            return f"{hours} hours, {minutes} minutes"
        else:
            return f"{minutes} minutes"

    def save(self, *args, **kwargs):
        """Override save to automatically set status if overdue."""
        if self.is_overdue and self.status == 'not_started':
            self.status = 'overdue'
        super().save(*args, **kwargs)
