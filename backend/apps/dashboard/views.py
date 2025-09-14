"""
Views for the dashboard app.
"""

from rest_framework import views, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from apps.courses.models import Course, Assignment
from apps.study_plans.models import StudyPlan
from .serializers import DashboardSerializer


class DashboardView(views.APIView):
    """
    API view to get all data for the main dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Get stats
        stats = self._get_stats(user)

        # Get upcoming assignments
        upcoming_assignments = self._get_upcoming_assignments(user)

        # Get recent courses
        recent_courses = self._get_recent_courses(user)

        # Serialize the data
        serializer = DashboardSerializer({
            'stats': stats,
            'upcoming_assignments': upcoming_assignments,
            'recent_courses': recent_courses
        })

        return Response(serializer.data)

    def _get_stats(self, user):
        """
        Calculate and return dashboard statistics.
        """
        # Course stats
        courses = Course.objects.filter(user=user)
        total_courses = courses.count()
        active_courses = courses.filter(is_active=True).count()

        # Assignment stats
        assignments = Assignment.objects.filter(course__user=user)
        total_assignments = assignments.count()
        completed_assignments = assignments.filter(status='completed').count()
        pending_assignments = total_assignments - completed_assignments

        # Study plan stats
        study_plans = StudyPlan.objects.filter(user=user)
        total_study_plans = study_plans.count()
        active_study_plans = study_plans.filter(status='active').count()

        # TODO: Implement study streak logic
        study_streak_days = 0

        return {
            'total_courses': total_courses,
            'active_courses': active_courses,
            'total_assignments': total_assignments,
            'pending_assignments': pending_assignments,
            'completed_assignments': completed_assignments,
            'total_study_plans': total_study_plans,
            'active_study_plans': active_study_plans,
            'study_streak_days': study_streak_days
        }

    def _get_upcoming_assignments(self, user, limit=5):
        """
        Get a list of upcoming assignments.
        """
        now = timezone.now()
        due_date_limit = now + timedelta(days=14)  # Next 2 weeks

        assignments = Assignment.objects.filter(
            course__user=user,
            due_date__gte=now,
            due_date__lte=due_date_limit,
            status__in=['not_started', 'in_progress']
        ).select_related('course').order_by('due_date')[:limit]

        serialized_assignments = []
        for a in assignments:
            serialized_assignments.append({
                'id': a.id,
                'title': a.title,
                'due_date': a.due_date,
                'course_name': a.course.name,
                'course_id': a.course.id,
                'days_until_due': a.days_until_due
            })

        return serialized_assignments

    def _get_recent_courses(self, user, limit=3):
        """
        Get a list of recently updated courses.
        """
        courses = Course.objects.filter(
            user=user).order_by('-updated_at')[:limit]

        serialized_courses = []
        for c in courses:
            serialized_courses.append({
                'id': c.id,
                'name': c.name,
                'code': c.code,
                'updated_at': c.updated_at,
                'progress_percentage': c.progress_percentage
            })

        return serialized_courses
