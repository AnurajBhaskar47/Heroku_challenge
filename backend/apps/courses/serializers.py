"""
Serializers for the courses app.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Course, Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Assignment model.
    """

    # Read-only computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_due = serializers.IntegerField(read_only=True)
    time_until_due = serializers.CharField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'assignment_type', 'description',
            'due_date', 'estimated_hours', 'weight', 'grade',
            'status', 'is_overdue', 'days_until_due', 'time_until_due',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_due_date(self, value):
        """Validate that due date is in the future for new assignments."""
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError(
                "Due date cannot be in the past for new assignments."
            )
        return value

    def validate_grade(self, value):
        """Validate grade is between 0 and 100."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Grade must be between 0 and 100."
            )
        return value

    def validate_weight(self, value):
        """Validate weight is between 0 and 100."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Weight must be between 0 and 100 percent."
            )
        return value


class AssignmentCreateSerializer(AssignmentSerializer):
    """
    Serializer for creating assignments with course reference.
    """
    course_id = serializers.IntegerField(write_only=True)

    class Meta(AssignmentSerializer.Meta):
        fields = AssignmentSerializer.Meta.fields + ['course_id']

    def validate_course_id(self, value):
        """Validate that the course exists and belongs to the user."""
        try:
            course = Course.objects.get(id=value)
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course does not exist.")

        # Check if the course belongs to the current user
        user = self.context['request'].user
        if course.user != user:
            raise serializers.ValidationError(
                "You can only create assignments for your own courses."
            )
        return value

    def create(self, validated_data):
        """Create assignment with course."""
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        assignment = Assignment.objects.create(course=course, **validated_data)
        return assignment


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for Course model.
    """

    # Read-only computed fields
    assignment_count = serializers.IntegerField(read_only=True)
    completed_assignment_count = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'instructor',
            'credits', 'semester', 'start_date', 'end_date',
            'class_schedule', 'syllabus_text', 'difficulty_level',
            'is_active', 'assignment_count', 'completed_assignment_count',
            'progress_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_credits(self, value):
        """Validate credits is between 1 and 10."""
        if value < 1 or value > 10:
            raise serializers.ValidationError(
                "Credits must be between 1 and 10."
            )
        return value

    def validate_difficulty_level(self, value):
        """Validate difficulty level is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Difficulty level must be between 1 and 5."
            )
        return value

    def validate(self, attrs):
        """Validate that start_date is before end_date."""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(
                "Start date must be before end date."
            )

        return attrs


class CourseDetailSerializer(CourseSerializer):
    """
    Detailed serializer for Course model with nested assignments.
    """
    assignments = AssignmentSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['assignments']


class CourseStatsSerializer(serializers.Serializer):
    """
    Serializer for course statistics.
    """
    total_courses = serializers.IntegerField()
    active_courses = serializers.IntegerField()
    total_assignments = serializers.IntegerField()
    completed_assignments = serializers.IntegerField()
    overdue_assignments = serializers.IntegerField()
    upcoming_assignments = serializers.IntegerField()
    average_progress = serializers.FloatField()


class AssignmentStatsSerializer(serializers.Serializer):
    """
    Serializer for assignment statistics by type.
    """
    assignment_type = serializers.CharField()
    count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    average_grade = serializers.FloatField()
