"""
Serializers for the study_plans app.
"""

from rest_framework import serializers
from django.utils import timezone
from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer
from .models import StudyPlan


class StudyPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for StudyPlan model.
    """

    # Read-only computed fields
    is_active = serializers.BooleanField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    days_elapsed = serializers.IntegerField(read_only=True)
    time_progress_percentage = serializers.FloatField(read_only=True)
    plan_summary = serializers.SerializerMethodField()
    upcoming_milestones = serializers.SerializerMethodField()

    # Course information
    course_info = CourseSerializer(source='course', read_only=True)

    class Meta:
        model = StudyPlan
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'status', 'progress_percentage', 'plan_data', 'course',
            'course_info', 'is_active', 'is_overdue', 'days_remaining',
            'duration_days', 'days_elapsed', 'time_progress_percentage',
            'plan_summary', 'upcoming_milestones', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'plan_embedding']

    def get_plan_summary(self, obj):
        """Get plan summary data."""
        return obj.get_plan_summary()

    def get_upcoming_milestones(self, obj):
        """Get upcoming milestones."""
        return obj.get_upcoming_milestones()

    def validate_course(self, value):
        """Validate that the course belongs to the user."""
        user = self.context['request'].user
        if value.user != user:
            raise serializers.ValidationError(
                "You can only create study plans for your own courses."
            )
        return value

    def validate(self, attrs):
        """Validate start and end dates."""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(
                "Start date must be before end date."
            )

        return attrs

    def validate_progress_percentage(self, value):
        """Validate progress percentage is between 0 and 100."""
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Progress percentage must be between 0 and 100."
            )
        return value

    def validate_plan_data(self, value):
        """Validate plan data structure."""
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "Plan data must be a JSON object.")

        # Optional: Validate specific structure
        # This can be extended based on requirements
        return value


class StudyPlanCreateSerializer(StudyPlanSerializer):
    """
    Serializer for creating study plans.
    """
    course_id = serializers.IntegerField(write_only=True)

    class Meta(StudyPlanSerializer.Meta):
        fields = [f for f in StudyPlanSerializer.Meta.fields if f !=
                  'course'] + ['course_id']

    def validate_course_id(self, value):
        """Validate that the course exists and belongs to the user."""
        try:
            course = Course.objects.get(id=value)
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course does not exist.")

        user = self.context['request'].user
        if course.user != user:
            raise serializers.ValidationError(
                "You can only create study plans for your own courses."
            )
        return value

    def create(self, validated_data):
        """Create study plan with course."""
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        study_plan = StudyPlan.objects.create(
            course=course,
            user=self.context['request'].user,
            **validated_data
        )
        return study_plan


class StudyPlanUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating study plan progress and data.
    """

    class Meta:
        model = StudyPlan
        fields = [
            'title', 'description', 'start_date', 'end_date',
            'status', 'progress_percentage', 'plan_data'
        ]

    def validate_progress_percentage(self, value):
        """Validate progress percentage."""
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Progress percentage must be between 0 and 100."
            )
        return value


class StudyPlanStatsSerializer(serializers.Serializer):
    """
    Serializer for study plan statistics.
    """
    total_plans = serializers.IntegerField()
    active_plans = serializers.IntegerField()
    completed_plans = serializers.IntegerField()
    draft_plans = serializers.IntegerField()
    overdue_plans = serializers.IntegerField()
    average_progress = serializers.FloatField()
    total_estimated_hours = serializers.FloatField()


class MilestoneSerializer(serializers.Serializer):
    """
    Serializer for study plan milestones.
    """
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    due_date = serializers.DateField()
    completed = serializers.BooleanField(default=False)
    progress_weight = serializers.FloatField(default=1.0)


class StudyTopicSerializer(serializers.Serializer):
    """
    Serializer for study topics within a plan.
    """
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    estimated_hours = serializers.FloatField(default=1.0)
    difficulty_level = serializers.IntegerField(
        min_value=1, max_value=5, default=3)
    resources = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    completed = serializers.BooleanField(default=False)
    completion_date = serializers.DateTimeField(
        allow_null=True, required=False)
