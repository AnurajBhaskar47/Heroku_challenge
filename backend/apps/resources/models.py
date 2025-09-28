"""
Models for the resources app.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator
from django.urls import reverse


User = get_user_model()


class Resource(models.Model):
    """
    Model representing a study resource.

    Resources can be links, documents, videos, or other learning materials.
    """

    # Resource Type Choices
    RESOURCE_TYPE_CHOICES = [
        ('pdf', 'PDF Document'),
        ('docx', 'Word Document'),
        ('txt', 'Text File'),
        ('pptx', 'PowerPoint'),
        ('article', 'Article'),
        ('video', 'Video'),
        ('book', 'Book'),
        ('course', 'Online Course'),
        ('tutorial', 'Tutorial'),
        ('documentation', 'Documentation'),
        ('paper', 'Research Paper'),
        ('quiz', 'Quiz/Practice'),
        ('tool', 'Tool/Software'),
        ('url', 'Web Link'),
        ('other', 'Other'),
    ]

    # Basic Information
    title = models.CharField(
        max_length=200,
        help_text="Resource title"
    )

    description = models.TextField(
        blank=True,
        help_text="Resource description"
    )

    url = models.URLField(
        blank=True,
        help_text="Resource URL"
    )

    # Store original filename for reference (files processed directly without storage)
    original_filename = models.CharField(
        max_length=255,
        blank=True,
        help_text="Original filename of uploaded file"
    )

    resource_type = models.CharField(
        max_length=20,
        choices=RESOURCE_TYPE_CHOICES,
        blank=True,
        help_text="Type of resource"
    )

    # Classification
    subject = models.CharField(
        max_length=100,
        blank=True,
        help_text="Subject area (e.g., Mathematics, Computer Science)"
    )

    topics = models.JSONField(
        default=list,
        blank=True,
        help_text="List of topics covered by this resource"
    )

    # Quality Metrics
    difficulty_level = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Difficulty level from 1 (beginner) to 5 (expert)"
    )

    estimated_time = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.1)],
        help_text="Estimated time to complete (in hours)"
    )

    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Average user rating (0-5 stars)"
    )

    # Usage Stats
    view_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this resource has been viewed"
    )

    # Verification
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this resource has been verified by an admin"
    )

    # Relationships
    added_by_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='added_resources',
        help_text="User who added this resource"
    )

    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='resources',
        help_text="Course this resource belongs to"
    )

    # Vector Search Support (pgvector-ready)
    embedding = ArrayField(
        models.FloatField(),
        size=1536,  # Standard embedding size
        null=True,
        blank=True,
        help_text="Vector embedding for semantic search (pgvector-ready)"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources_resource'
        verbose_name = 'Resource'
        verbose_name_plural = 'Resources'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['resource_type']),
            models.Index(fields=['subject']),
            models.Index(fields=['difficulty_level']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return self.title

    @property
    def display_rating(self):
        """Return formatted rating display."""
        if self.rating is None:
            return "Not rated"
        return f"{self.rating}/5.0"

    @property
    def difficulty_display(self):
        """Return human-readable difficulty level."""
        levels = {
            1: "Beginner",
            2: "Easy",
            3: "Intermediate",
            4: "Advanced",
            5: "Expert"
        }
        return levels.get(self.difficulty_level, "Unknown")

    @property
    def topics_list(self):
        """Return topics as a list (compatibility method)."""
        if isinstance(self.topics, list):
            return self.topics
        return []

    def increment_view_count(self):
        """Increment the view count for this resource."""
        self.view_count += 1
        self.save(update_fields=['view_count'])

    def get_absolute_url(self):
        """Return the URL for this resource."""
        return self.url or reverse('admin:resources_resource_change', args=[self.pk])

    @property
    def is_external_resource(self):
        """Check if this resource has an external URL."""
        return bool(self.url)


class ResourceRating(models.Model):
    """
    Model for user ratings of resources.
    """
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name='user_ratings'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='resource_ratings'
    )

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )

    review = models.TextField(
        blank=True,
        help_text="Optional review text"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources_resourcerating'
        verbose_name = 'Resource Rating'
        verbose_name_plural = 'Resource Ratings'
        unique_together = ['resource', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.resource.title} ({self.rating}/5)"


class ResourceCollection(models.Model):
    """
    Model for user-created collections of resources.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='resource_collections'
    )

    name = models.CharField(
        max_length=100,
        help_text="Collection name"
    )

    description = models.TextField(
        blank=True,
        help_text="Collection description"
    )

    resources = models.ManyToManyField(
        Resource,
        related_name='collections',
        blank=True
    )

    is_public = models.BooleanField(
        default=False,
        help_text="Whether this collection is publicly visible"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources_resourcecollection'
        verbose_name = 'Resource Collection'
        verbose_name_plural = 'Resource Collections'
        unique_together = ['user', 'name']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} by {self.user.username}"

    @property
    def resource_count(self):
        """Return the number of resources in this collection."""
        return self.resources.count()
