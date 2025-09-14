"""
Serializers for the dashboard app.
"""

from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for overall dashboard statistics.
    """
    total_courses = serializers.IntegerField(
        help_text="Total number of courses")
    active_courses = serializers.IntegerField(
        help_text="Number of active courses")
    total_assignments = serializers.IntegerField(
        help_text="Total number of assignments")
    pending_assignments = serializers.IntegerField(
        help_text="Number of assignments not yet completed")
    completed_assignments = serializers.IntegerField(
        help_text="Number of completed assignments")
    total_study_plans = serializers.IntegerField(
        help_text="Total number of study plans")
    active_study_plans = serializers.IntegerField(
        help_text="Number of active study plans")
    study_streak_days = serializers.IntegerField(
        help_text="Current study streak in days")


class UpcomingAssignmentSerializer(serializers.Serializer):
    """
    Serializer for an upcoming assignment.
    """
    id = serializers.IntegerField()
    title = serializers.CharField()
    due_date = serializers.DateTimeField()
    course_name = serializers.CharField()
    course_id = serializers.IntegerField()
    days_until_due = serializers.IntegerField()


class RecentCourseSerializer(serializers.Serializer):
    """
    Serializer for a recently accessed/updated course.
    """
    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    updated_at = serializers.DateTimeField()
    progress_percentage = serializers.FloatField()


class DashboardSerializer(serializers.Serializer):
    """
    Main serializer for all dashboard data.
    """
    stats = DashboardStatsSerializer()
    upcoming_assignments = UpcomingAssignmentSerializer(many=True)
    recent_courses = RecentCourseSerializer(many=True)
