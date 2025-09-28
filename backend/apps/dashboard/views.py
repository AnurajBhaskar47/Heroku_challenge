"""
Views for the dashboard app.
"""

from rest_framework import views, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from apps.courses.models import Course, Assignment, Exam
from apps.study_plans.models import StudyPlan
from .serializers import DashboardSerializer


class DashboardView(views.APIView):
    """
    API view to get all data for the main dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        try:
            # Get stats
            stats = self._get_stats(user)

            # Get upcoming assignments
            upcoming_assignments = self._get_upcoming_assignments(user)

            # Get upcoming exams/quizzes
            upcoming_exams = self._get_upcoming_exams(user)

            # Get upcoming study plan deadlines
            upcoming_study_plan_deadlines = self._get_upcoming_study_plan_deadlines(user)

            # Get recent courses
            recent_courses = self._get_recent_courses(user)

            # Serialize the data
            serializer = DashboardSerializer({
                'stats': stats,
                'upcoming_assignments': upcoming_assignments,
                'upcoming_exams': upcoming_exams,
                'upcoming_study_plan_deadlines': upcoming_study_plan_deadlines,
                'recent_courses': recent_courses
            })

            return Response(serializer.data)
        except Exception as e:
            # Log the error and return a fallback response
            print(f"Dashboard error: {e}")
            import traceback
            traceback.print_exc()
            
            # Return minimal data to prevent complete failure
            fallback_data = {
                'stats': {
                    'total_courses': 0,
                    'active_courses': 0,
                    'total_assignments': 0,
                    'pending_assignments': 0,
                    'completed_assignments': 0,
                    'total_study_plans': 0,
                    'active_study_plans': 0,
                    'study_streak_days': 0
                },
                'upcoming_assignments': [],
                'upcoming_exams': [],
                'upcoming_study_plan_deadlines': [],
                'recent_courses': []
            }
            
            serializer = DashboardSerializer(fallback_data)
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

    def _get_upcoming_exams(self, user, limit=5):
        """
        Get a list of upcoming exams and quizzes.
        """
        now = timezone.now()
        exam_date_limit = now + timedelta(days=14)  # Next 2 weeks

        exams = Exam.objects.filter(
            course__user=user,
            exam_date__gte=now,
            exam_date__lte=exam_date_limit,
            status='upcoming'
        ).select_related('course').order_by('exam_date')[:limit]

        serialized_exams = []
        for e in exams:
            try:
                serialized_exams.append({
                    'id': e.id,
                    'name': e.name,
                    'exam_date': e.exam_date,
                    'exam_type': e.exam_type,
                    'exam_type_display': e.get_exam_type_display(),
                    'course_name': e.course.name,
                    'course_id': e.course.id,
                    'days_until_exam': e.days_until_exam or 0,
                    'location': e.location or '',
                    'duration_minutes': e.duration_minutes or 0,
                    'preparation_percentage': float(e.preparation_percentage) if e.preparation_percentage is not None else 0.0
                })
            except Exception as ex:
                # Log the error but continue processing other exams
                print(f"Error processing exam {e.id}: {ex}")
                continue

        return serialized_exams

    def _get_upcoming_study_plan_deadlines(self, user, limit=5):
        """
        Get a list of upcoming study plan deadlines.
        """
        now = timezone.now()
        deadline_limit = now + timedelta(days=14)  # Next 2 weeks

        study_plans = StudyPlan.objects.filter(
            user=user,
            end_date__gte=now,
            end_date__lte=deadline_limit,
            status__in=['active', 'in_progress']
        ).order_by('end_date')[:limit]

        serialized_deadlines = []
        for sp in study_plans:
            try:
                days_until_deadline = (sp.end_date - now.date()).days if sp.end_date else None
                
                serialized_deadlines.append({
                    'id': sp.id,
                    'title': sp.title,
                    'end_date': sp.end_date,
                    'status': sp.status,
                    'progress_percentage': float(sp.progress_percentage) if sp.progress_percentage is not None else 0.0,
                    'days_until_deadline': days_until_deadline
                })
            except Exception as ex:
                # Log the error but continue processing other study plans
                print(f"Error processing study plan {sp.id}: {ex}")
                continue

        return serialized_deadlines

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
