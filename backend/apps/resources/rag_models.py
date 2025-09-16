"""
Enhanced RAG-ready models for Study Bud using Heroku pgvector.

This module defines the core models for the RAG pipeline:
- Document chunks with vector embeddings
- Knowledge extraction and indexing
- Context-aware study plan generation
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from pgvector.django import VectorField
import uuid

User = get_user_model()


class DocumentChunk(models.Model):
    """
    Represents a chunk of processed document content with vector embeddings.
    
    This is the core of our RAG system - each chunk contains:
    - Original content text
    - Vector embedding for semantic search
    - Metadata for context and filtering
    """
    
    CHUNK_TYPES = [
        ('text', 'Text Content'),
        ('syllabus', 'Syllabus Section'),
        ('assignment', 'Assignment Description'),
        ('quiz_info', 'Quiz Information'),
        ('lecture_notes', 'Lecture Notes'),
        ('textbook', 'Textbook Content'),
        ('research_paper', 'Research Paper'),
        ('video_transcript', 'Video Transcript'),
    ]

    # Unique identifier
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    resource = models.ForeignKey(
        'Resource',
        on_delete=models.CASCADE,
        related_name='chunks',
        help_text="Parent resource this chunk belongs to"
    )
    
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='document_chunks',
        help_text="Course this content is associated with"
    )
    
    # Content
    content = models.TextField(
        help_text="The actual text content of this chunk"
    )
    
    chunk_type = models.CharField(
        max_length=20,
        choices=CHUNK_TYPES,
        default='text',
        help_text="Type of content this chunk represents"
    )
    
    # Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
    embedding = VectorField(
        dimensions=1536,
        help_text="Vector embedding for semantic search"
    )
    
    # Chunk metadata
    chunk_index = models.IntegerField(
        help_text="Position of this chunk in the original document"
    )
    
    word_count = models.IntegerField(
        help_text="Number of words in this chunk"
    )
    
    # Academic context
    difficulty_level = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Difficulty level of this content (1=basic, 5=advanced)"
    )
    
    topics = models.JSONField(
        default=list,
        help_text="List of topics/concepts covered in this chunk"
    )
    
    # Learning objectives
    learning_objectives = models.JSONField(
        default=list,
        help_text="Learning objectives this chunk addresses"
    )
    
    # Estimated study time
    estimated_study_time = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Estimated time to study this chunk (minutes)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources_document_chunk'
        verbose_name = 'Document Chunk'
        verbose_name_plural = 'Document Chunks'
        ordering = ['resource', 'chunk_index']
        indexes = [
            models.Index(fields=['chunk_type']),
            models.Index(fields=['difficulty_level']),
            models.Index(fields=['course']),
        ]

    def __str__(self):
        return f"Chunk {self.chunk_index} from {self.resource.title}"


class StudyPlanContext(models.Model):
    """
    Stores contextual information for AI-powered study plan generation.
    
    This model captures all the context needed for generating personalized
    study plans using RAG.
    """
    
    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='study_contexts'
    )
    
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='study_contexts'
    )
    
    # Student preferences and constraints
    preferred_study_time_per_day = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=2.0,
        help_text="Hours student prefers to study per day"
    )
    
    preferred_difficulty_progression = models.CharField(
        max_length=20,
        choices=[
            ('gradual', 'Gradual increase'),
            ('mixed', 'Mixed difficulty'),
            ('front_loaded', 'Hardest topics first'),
            ('back_loaded', 'Easier topics first')
        ],
        default='gradual'
    )
    
    learning_style = models.JSONField(
        default=dict,
        help_text="Student's learning style preferences (visual, auditory, kinesthetic)"
    )
    
    # Current knowledge assessment
    current_knowledge_level = models.JSONField(
        default=dict,
        help_text="Student's self-assessed knowledge levels by topic"
    )
    
    # Academic schedule constraints
    available_study_slots = models.JSONField(
        default=list,
        help_text="Available time slots for studying (days/times)"
    )
    
    # Upcoming deadlines and assignments
    assignments = models.JSONField(
        default=list,
        help_text="List of assignments with due dates and requirements"
    )
    
    quiz_schedule = models.JSONField(
        default=list,
        help_text="Scheduled quizzes/exams with dates and topics"
    )
    
    # Goals and priorities
    target_grade = models.CharField(
        max_length=5,
        blank=True,
        help_text="Target grade (A+, A, B+, etc.)"
    )
    
    priority_topics = models.JSONField(
        default=list,
        help_text="Topics student wants to prioritize"
    )
    
    # Context embedding for similarity matching
    context_embedding = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
        help_text="Vector embedding of the entire context for similarity matching"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources_study_plan_context'
        verbose_name = 'Study Plan Context'
        verbose_name_plural = 'Study Plan Contexts'
        unique_together = ['user', 'course']

    def __str__(self):
        return f"Context for {self.user.username} - {self.course.name}"


class KnowledgeGraph(models.Model):
    """
    Represents relationships between concepts/topics for intelligent study sequencing.
    
    This helps the AI understand:
    - Prerequisites between topics
    - Topic difficulty relationships
    - Optimal learning sequences
    """
    
    # Relationships
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='knowledge_graphs'
    )
    
    # Topic information
    topic_name = models.CharField(
        max_length=200,
        help_text="Name of the topic/concept"
    )
    
    prerequisites = models.JSONField(
        default=list,
        help_text="List of prerequisite topics"
    )
    
    difficulty_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Difficulty level of this topic"
    )
    
    estimated_study_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        help_text="Estimated hours needed to master this topic"
    )
    
    # Topic embedding for similarity
    topic_embedding = VectorField(
        dimensions=1536,
        help_text="Vector representation of this topic"
    )
    
    # Related resources
    related_chunks = models.ManyToManyField(
        DocumentChunk,
        blank=True,
        help_text="Document chunks that cover this topic"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources_knowledge_graph'
        verbose_name = 'Knowledge Graph Node'
        verbose_name_plural = 'Knowledge Graph Nodes'
        unique_together = ['course', 'topic_name']
        indexes = [
            models.Index(fields=['difficulty_level']),
            models.Index(fields=['course']),
        ]

    def __str__(self):
        return f"{self.topic_name} ({self.course.name})"


class RAGQuery(models.Model):
    """
    Stores RAG queries and results for analytics and caching.
    """
    
    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rag_queries'
    )
    
    # Query information
    query_text = models.TextField(
        help_text="The original query from the user"
    )
    
    query_type = models.CharField(
        max_length=50,
        choices=[
            ('study_plan_creation', 'Study Plan Creation'),
            ('study_plan_modification', 'Study Plan Modification'),
            ('resource_recommendation', 'Resource Recommendation'),
            ('concept_explanation', 'Concept Explanation'),
            ('schedule_optimization', 'Schedule Optimization'),
        ],
        help_text="Type of RAG query"
    )
    
    # Query embedding
    query_embedding = VectorField(
        dimensions=1536,
        help_text="Vector embedding of the query"
    )
    
    # Retrieved chunks and results
    retrieved_chunks = models.JSONField(
        help_text="IDs and scores of retrieved document chunks"
    )
    
    generated_response = models.TextField(
        help_text="AI-generated response"
    )
    
    # Metadata
    response_quality_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Quality score of the generated response (0-1)"
    )
    
    user_feedback = models.CharField(
        max_length=20,
        choices=[
            ('helpful', 'Helpful'),
            ('partially_helpful', 'Partially Helpful'),
            ('not_helpful', 'Not Helpful'),
        ],
        null=True,
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resources_rag_query'
        verbose_name = 'RAG Query'
        verbose_name_plural = 'RAG Queries'
        ordering = ['-created_at']

    def __str__(self):
        return f"Query by {self.user.username}: {self.query_text[:50]}..."




