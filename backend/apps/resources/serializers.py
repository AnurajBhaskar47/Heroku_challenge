"""
Serializers for the resources app.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Resource, ResourceRating, ResourceCollection

User = get_user_model()


class ResourceSerializer(serializers.ModelSerializer):
    """
    Serializer for Resource model.
    Note: Files are processed directly without storage for Heroku compatibility.
    """

    # Read-only computed fields
    display_rating = serializers.CharField(read_only=True)
    difficulty_display = serializers.CharField(read_only=True)
    topics_list = serializers.ListField(read_only=True)
    is_external_resource = serializers.BooleanField(read_only=True)
    added_by_username = serializers.CharField(
        source='added_by_user.username', read_only=True)
    file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'file', 'original_filename', 'resource_type',
            'subject', 'topics', 'topics_list', 'difficulty_level',
            'difficulty_display', 'estimated_time', 'rating',
            'display_rating', 'view_count', 'is_verified',
            'added_by_user', 'added_by_username', 'is_external_resource',
            'course', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'view_count', 'rating', 'created_at', 'updated_at', 'embedding'
        ]

    def validate_difficulty_level(self, value):
        """Validate difficulty level is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Difficulty level must be between 1 and 5."
            )
        return value

    def validate_estimated_time(self, value):
        """Validate estimated time is positive."""
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "Estimated time must be positive."
            )
        return value

    def validate_topics(self, value):
        """Validate topics is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Topics must be a list.")
        return value


class ResourceCreateSerializer(ResourceSerializer):
    """
    Serializer for creating resources.
    """

    class Meta(ResourceSerializer.Meta):
        fields = [f for f in ResourceSerializer.Meta.fields if f !=
                  'added_by_user']

    def create(self, validated_data):
        """Create resource with current user as added_by_user."""
        validated_data['added_by_user'] = self.context['request'].user
        return super().create(validated_data)


class ResourceRatingSerializer(serializers.ModelSerializer):
    """
    Serializer for ResourceRating model.
    """
    user_username = serializers.CharField(
        source='user.username', read_only=True)

    class Meta:
        model = ResourceRating
        fields = [
            'id', 'rating', 'review', 'user', 'user_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )
        return value


class ResourceCollectionSerializer(serializers.ModelSerializer):
    """
    Serializer for ResourceCollection model.
    """
    resource_count = serializers.IntegerField(read_only=True)
    user_username = serializers.CharField(
        source='user.username', read_only=True)

    class Meta:
        model = ResourceCollection
        fields = [
            'id', 'name', 'description', 'is_public',
            'resource_count', 'user', 'user_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class ResourceCollectionDetailSerializer(ResourceCollectionSerializer):
    """
    Detailed serializer for ResourceCollection with nested resources.
    """
    resources = ResourceSerializer(many=True, read_only=True)

    class Meta(ResourceCollectionSerializer.Meta):
        fields = ResourceCollectionSerializer.Meta.fields + ['resources']


class ResourceStatsSerializer(serializers.Serializer):
    """
    Serializer for resource statistics.
    """
    total_resources = serializers.IntegerField()
    verified_resources = serializers.IntegerField()
    resources_by_type = serializers.DictField()
    resources_by_difficulty = serializers.DictField()
    average_rating = serializers.FloatField()
    total_views = serializers.IntegerField()


class ResourceSearchSerializer(serializers.Serializer):
    """
    Serializer for resource search requests.
    """
    query = serializers.CharField(max_length=200)
    resource_type = serializers.ChoiceField(
        choices=Resource.RESOURCE_TYPE_CHOICES,
        required=False,
        allow_blank=True
    )
    subject = serializers.CharField(
        max_length=100, required=False, allow_blank=True)
    difficulty_level = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False
    )
    min_rating = serializers.FloatField(
        min_value=0,
        max_value=5,
        required=False
    )
    verified_only = serializers.BooleanField(default=False)
    limit = serializers.IntegerField(min_value=1, max_value=100, default=20)


class SemanticSearchRequestSerializer(serializers.Serializer):
    """
    Serializer for semantic search requests.
    """
    query = serializers.CharField(
        max_length=500,
        help_text="Search query for semantic matching"
    )
    resource_type = serializers.ChoiceField(
        choices=Resource.RESOURCE_TYPE_CHOICES,
        required=False,
        allow_blank=True,
        help_text="Filter by resource type"
    )
    limit = serializers.IntegerField(
        min_value=1,
        max_value=50,
        default=10,
        help_text="Maximum number of results to return"
    )
    min_similarity = serializers.FloatField(
        min_value=0.0,
        max_value=1.0,
        default=0.5,
        help_text="Minimum similarity score (0-1)"
    )


class ResourceRecommendationSerializer(serializers.Serializer):
    """
    Serializer for resource recommendations.
    """
    user_id = serializers.IntegerField(required=False)
    course_id = serializers.IntegerField(required=False)
    topics = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    difficulty_level = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False
    )
    resource_types = serializers.ListField(
        child=serializers.ChoiceField(choices=Resource.RESOURCE_TYPE_CHOICES),
        required=False
    )
    limit = serializers.IntegerField(
        min_value=1,
        max_value=20,
        default=5
    )


# === RAG-Powered AI Serializers ===

class AIStudyPlanRequestSerializer(serializers.Serializer):
    """
    Serializer for AI study plan generation requests.
    """
    course_id = serializers.IntegerField(
        help_text="Course ID for which to generate the study plan"
    )
    query = serializers.CharField(
        max_length=2000,
        help_text="Natural language description of study goals and constraints"
    )
    preferences = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Study preferences including hours per day, difficulty progression, etc."
    )


class StudyTopicSerializer(serializers.Serializer):
    """
    Serializer for study topics within a study plan.
    """
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    estimated_hours = serializers.DecimalField(max_digits=5, decimal_places=1)
    difficulty_level = serializers.IntegerField(min_value=1, max_value=5)
    prerequisites = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    learning_objectives = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    recommended_resources = serializers.ListField(
        child=serializers.IntegerField(),
        default=list,
        help_text="List of resource IDs"
    )
    order = serializers.IntegerField(help_text="Topic order in the study plan")


class AIStudyPlanResponseSerializer(serializers.Serializer):
    """
    Serializer for AI study plan generation responses.
    """
    success = serializers.BooleanField()
    study_plan = serializers.JSONField(
        help_text="Generated study plan structure"
    )
    course_id = serializers.IntegerField()
    query = serializers.CharField()
    generated_at = serializers.CharField()
    rag_context_used = serializers.BooleanField(
        help_text="Whether RAG context from resources was used"
    )
    error = serializers.CharField(required=False)
    details = serializers.CharField(required=False)


class AIQuestionRequestSerializer(serializers.Serializer):
    """
    Serializer for AI question requests.
    """
    question = serializers.CharField(
        max_length=1000,
        help_text="Question to ask the AI assistant"
    )
    course_id = serializers.IntegerField(
        required=False,
        help_text="Course ID for context (optional)"
    )
    context_type = serializers.ChoiceField(
        choices=[
            ('general', 'General Question'),
            ('concept', 'Concept Explanation'),
            ('homework', 'Homework Help'),
            ('exam_prep', 'Exam Preparation'),
            ('study_strategy', 'Study Strategy')
        ],
        default='general',
        help_text="Type of question for better context retrieval"
    )


class SourceSerializer(serializers.Serializer):
    """
    Serializer for source references in AI responses.
    """
    resource_id = serializers.IntegerField()
    resource_title = serializers.CharField()
    chunk_text = serializers.CharField()
    relevance_score = serializers.FloatField()
    page_number = serializers.IntegerField(required=False)


class AIQuestionResponseSerializer(serializers.Serializer):
    """
    Serializer for AI question responses.
    """
    answer = serializers.CharField()
    sources = SourceSerializer(many=True)
    confidence = serializers.FloatField(
        help_text="Confidence score of the answer (0-1)"
    )
    question = serializers.CharField()
    course_id = serializers.IntegerField(required=False)
    context_type = serializers.CharField()
    generated_at = serializers.CharField()
    rag_context_used = serializers.BooleanField()
    error = serializers.CharField(required=False)
    details = serializers.CharField(required=False)
