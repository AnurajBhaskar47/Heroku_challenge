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


class CourseQuiz(models.Model):
    """
    Model for storing quiz files that can be uploaded to a course.
    These are processed through the RAG pipeline for context.
    """

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='quiz_files',
        help_text="Course this quiz belongs to"
    )

    title = models.CharField(
        max_length=200,
        help_text="Quiz title"
    )

    description = models.TextField(
        blank=True,
        help_text="Quiz description or notes"
    )

    file = models.FileField(
        upload_to='courses/quizzes/',
        help_text="Quiz file (PDF, DOCX, TXT, etc.)"
    )

    file_type = models.CharField(
        max_length=20,
        blank=True,
        help_text="Detected file type"
    )

    # RAG Processing Status
    is_processed = models.BooleanField(
        default=False,
        help_text="Whether this quiz has been processed by the RAG pipeline"
    )

    processing_error = models.TextField(
        blank=True,
        help_text="Error message if RAG processing failed"
    )

    # Metadata
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses_quiz'
        verbose_name = 'Course Quiz'
        verbose_name_plural = 'Course Quizzes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.course.name}"


class CourseAssignmentFile(models.Model):
    """
    Model for storing assignment files that can be uploaded to a course.
    These are processed through the RAG pipeline for context and automatically
    create Assignment entries based on extracted information.
    """

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignment_files',
        help_text="Course this assignment file belongs to"
    )

    # Link to the created assignment (if successfully extracted)
    assignment = models.OneToOneField(
        'Assignment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_file',
        help_text="Assignment entry created from this file"
    )

    title = models.CharField(
        max_length=200,
        help_text="Assignment file title"
    )

    description = models.TextField(
        blank=True,
        help_text="Assignment description or instructions"
    )

    file = models.FileField(
        upload_to='courses/assignments/',
        help_text="Assignment file (PDF, DOCX, TXT, etc.)"
    )

    file_type = models.CharField(
        max_length=20,
        blank=True,
        help_text="Detected file type"
    )

    # RAG Processing Status
    is_processed = models.BooleanField(
        default=False,
        help_text="Whether this assignment has been processed by the RAG pipeline"
    )

    processing_error = models.TextField(
        blank=True,
        help_text="Error message if RAG processing failed"
    )

    # Metadata
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses_assignment_file'
        verbose_name = 'Course Assignment File'
        verbose_name_plural = 'Course Assignment Files'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.course.name}"


class CourseTopic(models.Model):
    """
    Model for storing course topics extracted from syllabus content.
    Can be created from text paste or PDF upload and processed through RAG pipeline.
    """

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='course_topics',
        help_text="Course this topic belongs to"
    )

    # Content Sources
    syllabus_text = models.TextField(
        blank=True,
        help_text="Syllabus text content pasted by user"
    )

    syllabus_file = models.FileField(
        upload_to='courses/syllabi/',
        blank=True,
        null=True,
        help_text="Uploaded syllabus file (PDF, DOCX, etc.)"
    )

    # Extracted Topics
    extracted_topics = models.JSONField(
        default=list,
        help_text="Topics extracted from syllabus content"
    )

    topics_summary = models.TextField(
        blank=True,
        help_text="AI-generated summary of course topics"
    )

    # RAG Processing Status
    is_processed = models.BooleanField(
        default=False,
        help_text="Whether the syllabus has been processed by the RAG pipeline"
    )

    processing_error = models.TextField(
        blank=True,
        help_text="Error message if RAG processing failed"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses_topic'
        verbose_name = 'Course Topic'
        verbose_name_plural = 'Course Topics'
        ordering = ['-created_at']

    def __str__(self):
        return f"Topics for {self.course.name}"

    @property
    def has_content(self):
        """Check if there's any content (text or file) to process."""
        return bool(self.syllabus_text.strip() or self.syllabus_file)

    @property
    def content_source(self):
        """Return the type of content source."""
        if self.syllabus_file:
            return "file"
        elif self.syllabus_text.strip():
            return "text"
        return "none"


class CourseTopicItem(models.Model):
    """
    Individual topic item extracted from course syllabus.
    Each topic has its own title, description, and difficulty level.
    """
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='topic_items',
        help_text="Course this topic belongs to"
    )

    course_topic = models.ForeignKey(
        CourseTopic,
        on_delete=models.CASCADE,
        related_name='topic_items',
        help_text="Parent CourseTopic (syllabus) this item was extracted from"
    )

    title = models.CharField(
        max_length=200,
        help_text="Topic title/name"
    )

    description = models.TextField(
        blank=True,
        help_text="Detailed description of the topic"
    )

    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='intermediate',
        help_text="Difficulty level of this topic"
    )

    order = models.PositiveIntegerField(
        default=0,
        help_text="Order of this topic in the syllabus"
    )

    is_completed = models.BooleanField(
        default=False,
        help_text="Whether this topic has been marked as completed"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses_topic_item'
        verbose_name = 'Course Topic Item'
        verbose_name_plural = 'Course Topic Items'
        ordering = ['order', 'created_at']
        unique_together = ['course_topic', 'title']

    def __str__(self):
        return f"{self.title} ({self.course.name})"


class Exam(models.Model):
    """
    Model representing course exams with timeline and syllabus coverage.
    """
    
    EXAM_TYPE_CHOICES = [
        ('midterm', 'Midterm'),
        ('final', 'Final Exam'),
        ('quiz', 'Quiz'),
        ('test', 'Test'),
        ('practical', 'Practical Exam'),
        ('oral', 'Oral Exam'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Relationships
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='exams',
        help_text="Course this exam belongs to"
    )
    
    # Basic Information
    name = models.CharField(
        max_length=200,
        help_text="Exam name or title"
    )
    
    exam_type = models.CharField(
        max_length=20,
        choices=EXAM_TYPE_CHOICES,
        default='test',
        help_text="Type of exam"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Exam description or additional notes"
    )
    
    # Scheduling
    exam_date = models.DateTimeField(
        help_text="Date and time of the exam"
    )
    
    duration_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Exam duration in minutes"
    )
    
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Exam location or room"
    )
    
    # Syllabus Coverage
    syllabus_coverage = models.JSONField(
        default=list,
        blank=True,
        help_text="List of topics/chapters covered in this exam with weightage"
    )
    
    total_weightage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Total weightage percentage in final grade"
    )
    
    # Status and Results
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='upcoming',
        help_text="Current status of the exam"
    )
    
    grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Grade received (percentage)"
    )
    
    # Study Planning
    preparation_status = models.JSONField(
        default=dict,
        blank=True,
        help_text="Study preparation progress for each topic"
    )
    
    study_plan_generated = models.BooleanField(
        default=False,
        help_text="Whether AI study plan has been generated for this exam"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses_exam'
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'
        ordering = ['exam_date']
        unique_together = ['course', 'name', 'exam_date']
    
    def __str__(self):
        return f"{self.name} - {self.course.name}"
    
    @property
    def is_upcoming(self):
        """Check if the exam is upcoming."""
        return self.exam_date > timezone.now() and self.status == 'upcoming'
    
    @property
    def days_until_exam(self):
        """Return the number of days until the exam."""
        if self.exam_date:
            delta = self.exam_date.date() - timezone.now().date()
            return delta.days
        return None
    
    @property
    def time_until_exam(self):
        """Return time until exam as a human-readable string."""
        if not self.exam_date:
            return None
        
        delta = self.exam_date - timezone.now()
        
        if delta.total_seconds() < 0:
            return "Past"
        
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        
        if days > 0:
            return f"{days} days, {hours} hours"
        elif hours > 0:
            return f"{hours} hours, {minutes} minutes"
        else:
            return f"{minutes} minutes"
    
    @property
    def preparation_percentage(self):
        """Calculate preparation progress percentage."""
        if not self.preparation_status:
            return 0
        
        total_topics = len(self.syllabus_coverage)
        if total_topics == 0:
            return 0
        
        completed_topics = sum(1 for topic in self.syllabus_coverage 
                             if self.preparation_status.get(topic.get('topic', ''), False))
        
        return round((completed_topics / total_topics) * 100, 2)
    
    def save(self, *args, **kwargs):
        """Override save to automatically update status based on date."""
        if self.exam_date and self.exam_date < timezone.now() and self.status == 'upcoming':
            self.status = 'completed'
        super().save(*args, **kwargs)
