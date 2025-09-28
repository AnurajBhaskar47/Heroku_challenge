"""
Views for the study_plans app.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .models import StudyPlan
from .serializers import (
    StudyPlanSerializer,
    StudyPlanCreateSerializer,
    StudyPlanUpdateSerializer,
    StudyPlanStatsSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List user's study plans",
        description="Retrieve a list of study plans for the authenticated user."
    ),
    create=extend_schema(
        summary="Create a new study plan",
        description="Create a new study plan for a specific course.",
        request=StudyPlanCreateSerializer
    ),
    retrieve=extend_schema(
        summary="Get study plan details",
        description="Retrieve detailed information about a specific study plan."
    ),
    update=extend_schema(
        summary="Update study plan",
        description="Update a study plan's information.",
        request=StudyPlanUpdateSerializer
    ),
    destroy=extend_schema(
        summary="Delete study plan",
        description="Delete a study plan."
    )
)
class StudyPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudyPlan model.

    Provides CRUD operations for study plans.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return study plans for the authenticated user."""
        return StudyPlan.objects.filter(
            user=self.request.user
        ).select_related('course', 'user').order_by('-created_at')

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'create':
            return StudyPlanCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StudyPlanUpdateSerializer
        return StudyPlanSerializer

    def perform_create(self, serializer):
        """Set the study plan owner to the current user."""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Handle manual status updates."""
        # Check if status is being updated in the request data
        is_status_update = 'status' in self.request.data
        
        if is_status_update:
            # Save with manual status update flag to bypass auto-completion logic
            instance = serializer.save(manual_status_update=True)
        else:
            instance = serializer.save()
        
        return instance

    @extend_schema(
        summary="Get study plan statistics",
        description="Get statistics about user's study plans.",
        responses={200: StudyPlanStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get study plan statistics for the user."""
        user_plans = self.get_queryset()

        stats = {
            'total_plans': user_plans.count(),
            'active_plans': user_plans.filter(status='active').count(),
            'completed_plans': user_plans.filter(status='completed').count(),
            'draft_plans': user_plans.filter(status='draft').count(),
            'overdue_plans': user_plans.filter(
                end_date__lt=timezone.now().date(),
                status__in=['active', 'paused']
            ).count(),
        }

        # Calculate average progress
        avg_progress = user_plans.aggregate(
            avg_progress=Avg('progress_percentage')
        )['avg_progress']
        stats['average_progress'] = avg_progress or 0

        # Calculate total estimated hours from plan_data
        total_estimated_hours = 0
        for plan in user_plans:
            if plan.plan_data and 'estimated_hours' in plan.plan_data:
                total_estimated_hours += plan.plan_data['estimated_hours']
        stats['total_estimated_hours'] = total_estimated_hours

        serializer = StudyPlanStatsSerializer(stats)
        return Response(serializer.data)

    @extend_schema(
        summary="Get active study plans",
        description="Get all active study plans for the user.",
        responses={200: StudyPlanSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active study plans."""
        active_plans = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(active_plans, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get overdue study plans",
        description="Get study plans that are past their end date.",
        responses={200: StudyPlanSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue study plans."""
        overdue_plans = self.get_queryset().filter(
            end_date__lt=timezone.now().date(),
            status__in=['active', 'paused']
        )
        serializer = self.get_serializer(overdue_plans, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Update study plan progress",
        description="Update the progress percentage of a study plan.",
        request={"progress_percentage": "float"},
        responses={200: StudyPlanSerializer}
    )
    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        """Update study plan progress."""
        study_plan = self.get_object()
        progress = request.data.get('progress_percentage')

        if progress is None:
            return Response(
                {'error': 'progress_percentage is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            progress = float(progress)
            if not (0 <= progress <= 100):
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'error': 'progress_percentage must be a number between 0 and 100'},
                status=status.HTTP_400_BAD_REQUEST
            )

        study_plan.update_progress(progress)
        serializer = self.get_serializer(study_plan)
        return Response(serializer.data)

    @extend_schema(
        summary="Update topic completion status",
        description="Mark a specific topic as completed or incomplete and update overall progress.",
        request={"topic_id": "string", "completed": "boolean"},
        responses={200: StudyPlanSerializer}
    )
    @action(detail=True, methods=['post'], url_path='update-topic')
    def update_topic_completion(self, request, pk=None):
        """Update topic completion status and recalculate progress."""
        study_plan = self.get_object()
        topic_id = request.data.get('topic_id')
        completed = request.data.get('completed')

        if topic_id is None or completed is None:
            return Response(
                {'error': 'topic_id and completed are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(completed, bool):
            return Response(
                {'error': 'completed must be a boolean'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update topic completion in plan_data
        if not study_plan.plan_data or 'topics' not in study_plan.plan_data:
            return Response(
                {'error': 'Study plan has no topics'},
                status=status.HTTP_400_BAD_REQUEST
            )

        topics = study_plan.plan_data.get('topics', [])
        topic_found = False
        
        for topic in topics:
            if str(topic.get('id')) == str(topic_id):
                topic['completed'] = completed
                topic_found = True
                break

        if not topic_found:
            return Response(
                {'error': 'Topic not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Recalculate progress based on completed topics
        total_topics = len(topics)
        completed_topics = sum(1 for topic in topics if topic.get('completed', False))
        new_progress = (completed_topics / total_topics * 100) if total_topics > 0 else 0

        # Update status based on progress changes
        if new_progress == 100 and study_plan.status != 'completed':
            # All topics completed - set to completed
            study_plan.status = 'completed'
        elif new_progress < 100 and study_plan.status == 'completed':
            # Progress dropped below 100% from completed state - set back to active
            study_plan.status = 'active'

        # Update the plan data and progress
        study_plan.plan_data = study_plan.plan_data  # Mark as changed
        study_plan.progress_percentage = new_progress
        study_plan.save(manual_status_update=True)  # Use manual flag to avoid auto-status logic

        serializer = self.get_serializer(study_plan)
        return Response(serializer.data)

    @extend_schema(
        summary="Activate study plan",
        description="Change study plan status to active.",
        responses={200: StudyPlanSerializer}
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a study plan."""
        study_plan = self.get_object()
        study_plan.status = 'active'
        study_plan.save(manual_status_update=True)

        serializer = self.get_serializer(study_plan)
        return Response(serializer.data)

    @extend_schema(
        summary="Pause study plan",
        description="Change study plan status to paused.",
        responses={200: StudyPlanSerializer}
    )
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a study plan."""
        study_plan = self.get_object()
        study_plan.status = 'paused'
        study_plan.save(manual_status_update=True)

        serializer = self.get_serializer(study_plan)
        return Response(serializer.data)

    @extend_schema(
        summary="Complete study plan",
        description="Mark study plan as completed.",
        responses={200: StudyPlanSerializer}
    )
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a study plan."""
        study_plan = self.get_object()
        study_plan.status = 'completed'
        study_plan.progress_percentage = 100
        study_plan.save(manual_status_update=True)

        serializer = self.get_serializer(study_plan)
        return Response(serializer.data)

    @extend_schema(
        summary="Get upcoming milestones",
        description="Get milestones due within the next 7 days for this study plan.",
        responses={200: "list of milestones"}
    )
    @action(detail=True, methods=['get'], url_path='upcoming-milestones')
    def upcoming_milestones(self, request, pk=None):
        """Get upcoming milestones for this study plan."""
        study_plan = self.get_object()
        days_ahead = int(request.query_params.get('days', 7))
        milestones = study_plan.get_upcoming_milestones(days_ahead)

        return Response({
            'study_plan_id': study_plan.id,
            'study_plan_title': study_plan.title,
            'milestones': milestones
        })

    @extend_schema(
        summary="Duplicate study plan",
        description="Create a copy of an existing study plan.",
        responses={201: StudyPlanSerializer}
    )
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a study plan."""
        original_plan = self.get_object()

        # Create a new plan with copied data
        new_plan_data = {
            'title': f"Copy of {original_plan.title}",
            'description': original_plan.description,
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + (
                original_plan.end_date - original_plan.start_date
            ) if original_plan.duration_days else timezone.now().date() + timezone.timedelta(days=30),
            'status': 'draft',
            'progress_percentage': 0,
            'plan_data': original_plan.plan_data.copy() if original_plan.plan_data else {},
            'course': original_plan.course,
            'user': request.user
        }

        new_plan = StudyPlan.objects.create(**new_plan_data)
        serializer = self.get_serializer(new_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Get study plan calendar events",
        description="Get study plan deadlines formatted for calendar display.",
        responses={200: "list of calendar events"}
    )
    @action(detail=False, methods=['get'], url_path='calendar-events')
    def calendar_events(self, request):
        """Get study plan deadlines formatted for calendar display."""
        queryset = self.get_queryset().filter(
            status__in=['active', 'in_progress'],
            end_date__isnull=False
        )
        
        events = []
        for plan in queryset:
            events.append({
                'id': f'study_plan_{plan.id}',
                'title': f"{plan.title}",
                'start': plan.end_date.isoformat(),
                'end': plan.end_date.isoformat(),
                'type': 'study_plan_deadline',
                'status': plan.status,
                'progress_percentage': float(plan.progress_percentage),
                'description': plan.description,
                'course_name': plan.course.name if plan.course else None,
                'course_id': plan.course.id if plan.course else None,
                'days_remaining': plan.days_remaining
            })
        
        return Response(events)
