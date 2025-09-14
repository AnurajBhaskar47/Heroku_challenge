"""
Views for the courses app.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .models import Course, Assignment
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    CourseStatsSerializer,
    AssignmentSerializer,
    AssignmentCreateSerializer,
    AssignmentStatsSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List user's courses",
        description="Retrieve a list of courses for the authenticated user."
    ),
    create=extend_schema(
        summary="Create a new course",
        description="Create a new course for the authenticated user."
    ),
    retrieve=extend_schema(
        summary="Get course details",
        description="Retrieve detailed information about a specific course."
    ),
    update=extend_schema(
        summary="Update course",
        description="Update a course's information."
    ),
    destroy=extend_schema(
        summary="Delete course",
        description="Delete a course and all its assignments."
    )
)
class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model.

    Provides CRUD operations for courses.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return courses for the authenticated user."""
        return Course.objects.filter(user=self.request.user).prefetch_related('assignments')

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        """Set the course owner to the current user."""
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="Get course statistics",
        description="Get statistics about user's courses.",
        responses={200: CourseStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get course statistics for the user."""
        user_courses = self.get_queryset()
        user_assignments = Assignment.objects.filter(course__user=request.user)

        stats = {
            'total_courses': user_courses.count(),
            'active_courses': user_courses.filter(is_active=True).count(),
            'total_assignments': user_assignments.count(),
            'completed_assignments': user_assignments.filter(
                status__in=['completed', 'submitted']
            ).count(),
            'overdue_assignments': user_assignments.filter(
                due_date__lt=timezone.now(),
                status__in=['not_started', 'in_progress']
            ).count(),
            'upcoming_assignments': user_assignments.filter(
                due_date__gte=timezone.now(),
                due_date__lte=timezone.now() + timezone.timedelta(days=7)
            ).count(),
        }

        # Calculate average progress
        course_progresses = [
            course.progress_percentage for course in user_courses]
        stats['average_progress'] = (
            sum(course_progresses) / len(course_progresses)
            if course_progresses else 0
        )

        serializer = CourseStatsSerializer(stats)
        return Response(serializer.data)

    @extend_schema(
        summary="Get course assignment statistics",
        description="Get assignment statistics for the specified course.",
        responses={200: AssignmentStatsSerializer(many=True)}
    )
    @action(detail=True, methods=['get'], url_path='assignment-stats')
    def assignment_stats(self, request, pk=None):
        """Get assignment statistics for this course."""
        course = self.get_object()
        stats = course.assignments.values('assignment_type').annotate(
            count=Count('id'),
            completed_count=Count(
                'id',
                filter=Q(status__in=['completed', 'submitted'])
            ),
            average_grade=Avg('grade')
        ).order_by('-count')

        serializer = AssignmentStatsSerializer(stats, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List course assignments",
        description="Retrieve assignments for a specific course."
    ),
    create=extend_schema(
        summary="Create course assignment",
        description="Create a new assignment for the specified course."
    ),
    retrieve=extend_schema(
        summary="Get assignment details",
        description="Retrieve detailed information about a specific assignment."
    ),
    update=extend_schema(
        summary="Update assignment",
        description="Update an assignment's information."
    ),
    destroy=extend_schema(
        summary="Delete assignment",
        description="Delete an assignment."
    )
)
class NestedAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assignment model nested under courses.

    Provides CRUD operations for assignments within a specific course.
    URL pattern: /courses/{course_id}/assignments/{assignment_id}/
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return assignments for the specified course and authenticated user."""
        course_id = self.kwargs.get('course_pk')
        return Assignment.objects.filter(
            course_id=course_id,
            course__user=self.request.user
        ).select_related('course')

    def get_course(self):
        """Get the course instance for this assignment."""
        course_id = self.kwargs.get('course_pk')
        return get_object_or_404(
            Course,
            id=course_id,
            user=self.request.user
        )

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        # Always use AssignmentSerializer since course is provided by URL
        return AssignmentSerializer

    def perform_create(self, serializer):
        """Create assignment for the specified course."""
        course = self.get_course()
        serializer.save(course=course)

    @extend_schema(
        summary="Mark assignment as completed",
        description="Mark an assignment as completed.",
        responses={200: AssignmentSerializer}
    )
    @action(detail=True, methods=['post'], url_path='mark-completed')
    def mark_completed(self, request, course_pk=None, pk=None):
        """Mark assignment as completed."""
        assignment = self.get_object()
        assignment.status = 'completed'
        assignment.save()

        serializer = self.get_serializer(assignment)
        return Response(serializer.data)

    @extend_schema(
        summary="Mark assignment as in progress",
        description="Mark an assignment as in progress.",
        responses={200: AssignmentSerializer}
    )
    @action(detail=True, methods=['post'], url_path='mark-in-progress')
    def mark_in_progress(self, request, course_pk=None, pk=None):
        """Mark assignment as in progress."""
        assignment = self.get_object()
        assignment.status = 'in_progress'
        assignment.save()

        serializer = self.get_serializer(assignment)
        return Response(serializer.data)


@extend_schema_view(
    upcoming=extend_schema(
        summary="Get upcoming assignments",
        description="Get assignments due within the next 7 days across all courses."
    ),
    overdue=extend_schema(
        summary="Get overdue assignments",
        description="Get assignments that are past their due date across all courses."
    ),
    stats_by_type=extend_schema(
        summary="Get assignment statistics by type",
        description="Get statistics about assignments grouped by type across all courses."
    )
)
class GlobalAssignmentViewSet(viewsets.GenericViewSet):
    """
    ViewSet for global assignment operations across all user's courses.

    Provides user-level assignment statistics and filtering.
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return all assignments for the authenticated user."""
        return Assignment.objects.filter(
            course__user=self.request.user
        ).select_related('course').order_by('due_date')

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get assignments due in the next 7 days."""
        upcoming_assignments = self.get_queryset().filter(
            due_date__gte=timezone.now(),
            due_date__lte=timezone.now() + timezone.timedelta(days=7),
            status__in=['not_started', 'in_progress']
        )
        serializer = self.get_serializer(upcoming_assignments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue assignments."""
        overdue_assignments = self.get_queryset().filter(
            due_date__lt=timezone.now(),
            status__in=['not_started', 'in_progress']
        )
        serializer = self.get_serializer(overdue_assignments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats-by-type')
    def stats_by_type(self, request):
        """Get assignment statistics grouped by type."""
        stats = self.get_queryset().values('assignment_type').annotate(
            count=Count('id'),
            completed_count=Count(
                'id',
                filter=Q(status__in=['completed', 'submitted'])
            ),
            average_grade=Avg('grade')
        ).order_by('-count')

        serializer = AssignmentStatsSerializer(stats, many=True)
        return Response(serializer.data)
