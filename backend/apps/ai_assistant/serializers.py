"""
Serializers for the ai_assistant app.
"""

from rest_framework import serializers


class ExplainRequestSerializer(serializers.Serializer):
    """
    Serializer for AI explanation requests.
    """
    topic = serializers.CharField(
        max_length=500,
        help_text="Topic to explain"
    )
    context = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Additional context for the explanation"
    )
    difficulty_level = serializers.IntegerField(
        min_value=1,
        max_value=5,
        default=3,
        help_text="Difficulty level from 1 (beginner) to 5 (expert)"
    )
    explanation_type = serializers.ChoiceField(
        choices=[
            ('simple', 'Simple explanation'),
            ('detailed', 'Detailed explanation'),
            ('example', 'Explanation with examples'),
            ('step_by_step', 'Step-by-step guide'),
        ],
        default='detailed',
        help_text="Type of explanation needed"
    )


class ExplainResponseSerializer(serializers.Serializer):
    """
    Serializer for AI explanation responses.
    """
    topic = serializers.CharField()
    explanation = serializers.CharField()
    difficulty_level = serializers.IntegerField()
    explanation_type = serializers.CharField()
    generated_at = serializers.DateTimeField()
    service_used = serializers.CharField()


class StudyPlanRequestSerializer(serializers.Serializer):
    """
    Serializer for AI study plan generation requests.
    """
    course_id = serializers.IntegerField(
        help_text="ID of the course to create a study plan for"
    )
    preferences = serializers.JSONField(
        default=dict,
        help_text="User preferences for study plan generation"
    )
    duration_weeks = serializers.IntegerField(
        min_value=1,
        max_value=52,
        default=4,
        help_text="Duration of the study plan in weeks"
    )
    study_hours_per_week = serializers.IntegerField(
        min_value=1,
        max_value=40,
        default=5,
        help_text="Target study hours per week"
    )
    focus_areas = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        help_text="Specific areas to focus on"
    )
    difficulty_preference = serializers.IntegerField(
        min_value=1,
        max_value=5,
        default=3,
        help_text="Preferred difficulty level"
    )


class StudyPlanResponseSerializer(serializers.Serializer):
    """
    Serializer for AI study plan generation responses.
    """
    success = serializers.BooleanField()
    plan = serializers.JSONField()
    service_used = serializers.CharField()
    generated_at = serializers.DateTimeField()
    course_id = serializers.IntegerField()
    estimated_total_hours = serializers.FloatField()
    message = serializers.CharField()


class SemanticSearchRequestSerializer(serializers.Serializer):
    """
    Serializer for semantic search requests.
    """
    query = serializers.CharField(
        max_length=500,
        help_text="Search query"
    )
    resource_type = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text="Filter by resource type"
    )
    limit = serializers.IntegerField(
        min_value=1,
        max_value=50,
        default=10,
        help_text="Maximum number of results"
    )
    similarity_threshold = serializers.FloatField(
        min_value=0.0,
        max_value=1.0,
        default=0.5,
        help_text="Minimum similarity threshold"
    )


class SemanticSearchResponseSerializer(serializers.Serializer):
    """
    Serializer for semantic search responses.
    """
    results = serializers.ListField(
        child=serializers.JSONField(),
        help_text="Search results with similarity scores"
    )
    query = serializers.CharField()
    total_results = serializers.IntegerField()
    service_used = serializers.CharField()
    search_time_ms = serializers.IntegerField()


class StudyRecommendationRequestSerializer(serializers.Serializer):
    """
    Serializer for study recommendation requests.
    """
    user_id = serializers.IntegerField(
        required=False,
        help_text="User ID for personalized recommendations"
    )
    course_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Course IDs to base recommendations on"
    )
    topics = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        help_text="Topics of interest"
    )
    difficulty_level = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        help_text="Preferred difficulty level"
    )
    resource_types = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        help_text="Preferred resource types"
    )
    limit = serializers.IntegerField(
        min_value=1,
        max_value=20,
        default=5,
        help_text="Number of recommendations"
    )


class StudyRecommendationResponseSerializer(serializers.Serializer):
    """
    Serializer for study recommendation responses.
    """
    recommendations = serializers.ListField(
        child=serializers.JSONField(),
        help_text="List of recommended resources/activities"
    )
    reasoning = serializers.CharField(
        help_text="AI reasoning for the recommendations"
    )
    confidence_score = serializers.FloatField(
        help_text="Confidence in recommendations (0-1)"
    )
    service_used = serializers.CharField()
    generated_at = serializers.DateTimeField()


class ChatRequestSerializer(serializers.Serializer):
    """
    Serializer for AI chat requests.
    """
    message = serializers.CharField(
        max_length=2000,
        help_text="User message"
    )
    context = serializers.JSONField(
        default=dict,
        help_text="Conversation context"
    )
    course_id = serializers.IntegerField(
        required=False,
        help_text="Related course ID for context"
    )


class ChatResponseSerializer(serializers.Serializer):
    """
    Serializer for AI chat responses.
    """
    response = serializers.CharField()
    context = serializers.JSONField()
    service_used = serializers.CharField()
    response_time_ms = serializers.IntegerField()
    generated_at = serializers.DateTimeField()


class AIServiceStatusSerializer(serializers.Serializer):
    """
    Serializer for AI service status information.
    """
    gemini_available = serializers.BooleanField()
    vector_search_enabled = serializers.BooleanField()
    embedding_service = serializers.CharField()
    cache_enabled = serializers.BooleanField()
    fallback_enabled = serializers.BooleanField()
    last_health_check = serializers.DateTimeField()
    services = serializers.JSONField()
