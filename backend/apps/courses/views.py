"""
Views for the courses app.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
import os
import logging

# Import RAG extensions at module level to avoid app loading issues
try:
    from apps.resources.course_rag_extension import CourseRAGExtension
    RAG_AVAILABLE = True
except ImportError as e:
    logging.getLogger(__name__).warning(f"CourseRAGExtension not available: {e}")
    CourseRAGExtension = None
    RAG_AVAILABLE = False

from .models import Course, Assignment, CourseQuiz, CourseAssignmentFile, CourseTopic, CourseTopicItem
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    CourseDetailWithFilesSerializer,
    CourseStatsSerializer,
    AssignmentSerializer,
    AssignmentCreateSerializer,
    AssignmentStatsSerializer,
    CourseQuizSerializer,
    CourseAssignmentFileSerializer,
    CourseTopicSerializer,
    CourseTopicItemSerializer
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
        return Course.objects.filter(user=self.request.user).prefetch_related(
            'assignments',
            'quiz_files',
            'assignment_files',
            'course_topics'
        )

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'retrieve':
            return CourseDetailWithFilesSerializer
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


logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List course quiz files",
        description="Retrieve quiz files for a specific course."
    ),
    create=extend_schema(
        summary="Upload course quiz file",
        description="Upload a new quiz file for the specified course."
    ),
    retrieve=extend_schema(
        summary="Get quiz file details",
        description="Retrieve detailed information about a specific quiz file."
    ),
    update=extend_schema(
        summary="Update quiz file",
        description="Update a quiz file's information."
    ),
    destroy=extend_schema(
        summary="Delete quiz file",
        description="Delete a quiz file."
    )
)
class CourseQuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseQuiz model nested under courses.
    
    Handles quiz file uploads with RAG processing.
    URL pattern: /courses/{course_id}/quiz-files/{quiz_id}/
    """
    serializer_class = CourseQuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return quiz files for the specified course and authenticated user."""
        course_id = self.kwargs.get('course_pk')
        return CourseQuiz.objects.filter(
            course_id=course_id,
            course__user=self.request.user
        ).select_related('course')

    def get_course(self):
        """Get the course instance for this quiz file."""
        course_id = self.kwargs.get('course_pk')
        return get_object_or_404(
            Course,
            id=course_id,
            user=self.request.user
        )

    def perform_create(self, serializer):
        """Create quiz file for the specified course with RAG processing."""
        course = self.get_course()
        quiz = serializer.save(course=course)
        
        # Set file metadata
        if quiz.file:
            quiz.file_size = quiz.file.size
            quiz.file_type = os.path.splitext(quiz.file.name)[1].lower().lstrip('.')
            quiz.save()
        
        # Process through RAG pipeline
        self._process_quiz_with_rag(quiz)

    def _process_quiz_with_rag(self, quiz):
        """Process quiz file through RAG pipeline."""
        try:
            # Import RAG extension (which auto-extends RAGPipeline)
            from apps.resources.course_rag_extension import CourseRAGExtension
            
            # Process the quiz file
            CourseRAGExtension.process_course_quiz(quiz)
            logger.info(f"Successfully processed quiz {quiz.id} through RAG pipeline")
            
        except ImportError:
            logger.warning("RAG pipeline not available - quiz processing skipped")
        except Exception as e:
            logger.error(f"Error processing quiz {quiz.id} through RAG: {str(e)}")
            quiz.processing_error = str(e)
            quiz.save()


@extend_schema_view(
    list=extend_schema(
        summary="List course assignment files",
        description="Retrieve assignment files for a specific course."
    ),
    create=extend_schema(
        summary="Upload course assignment file",
        description="Upload a new assignment file for the specified course."
    ),
    retrieve=extend_schema(
        summary="Get assignment file details",
        description="Retrieve detailed information about a specific assignment file."
    ),
    update=extend_schema(
        summary="Update assignment file",
        description="Update an assignment file's information."
    ),
    destroy=extend_schema(
        summary="Delete assignment file",
        description="Delete an assignment file."
    )
)
class CourseAssignmentFileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseAssignmentFile model nested under courses.
    
    Handles assignment file uploads with RAG processing.
    URL pattern: /courses/{course_id}/assignment-files/{assignment_file_id}/
    """
    serializer_class = CourseAssignmentFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return assignment files for the specified course and authenticated user."""
        course_id = self.kwargs.get('course_pk')
        return CourseAssignmentFile.objects.filter(
            course_id=course_id,
            course__user=self.request.user
        ).select_related('course')

    def get_course(self):
        """Get the course instance for this assignment file."""
        course_id = self.kwargs.get('course_pk')
        return get_object_or_404(
            Course,
            id=course_id,
            user=self.request.user
        )

    def perform_create(self, serializer):
        """Create assignment file for the specified course with RAG processing."""
        course = self.get_course()
        assignment_file = serializer.save(course=course)
        
        # Set file metadata
        if assignment_file.file:
            assignment_file.file_size = assignment_file.file.size
            assignment_file.file_type = os.path.splitext(assignment_file.file.name)[1].lower().lstrip('.')
            assignment_file.save()
        
        # Process through RAG pipeline
        self._process_assignment_with_rag(assignment_file)

    def _process_assignment_with_rag(self, assignment_file):
        """Process assignment file through RAG pipeline."""
        if not RAG_AVAILABLE or CourseRAGExtension is None:
            logger.warning("RAG pipeline not available - assignment file processing skipped")
            assignment_file.processing_error = "RAG pipeline not available"
            assignment_file.save()
            return
            
        try:
            # Process the assignment file using pre-imported CourseRAGExtension
            CourseRAGExtension.process_course_assignment(assignment_file)
            logger.info(f"Successfully processed assignment file {assignment_file.id} through RAG pipeline")
            
        except Exception as e:
            logger.error(f"Error processing assignment file {assignment_file.id} through RAG: {str(e)}")
            assignment_file.processing_error = str(e)
            assignment_file.save()


@extend_schema_view(
    list=extend_schema(
        summary="List course topics",
        description="Retrieve topics for a specific course."
    ),
    create=extend_schema(
        summary="Create course topics",
        description="Create or extract topics from syllabus content for the specified course."
    ),
    retrieve=extend_schema(
        summary="Get course topics details",
        description="Retrieve detailed information about course topics."
    ),
    update=extend_schema(
        summary="Update course topics",
        description="Update course topics information."
    ),
    destroy=extend_schema(
        summary="Delete course topics",
        description="Delete course topics."
    )
)
class CourseTopicViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseTopic model nested under courses.
    
    Handles syllabus content processing and topic extraction with RAG processing.
    URL pattern: /courses/{course_id}/topics/{topic_id}/
    """
    serializer_class = CourseTopicSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return topics for the specified course and authenticated user."""
        course_id = self.kwargs.get('course_pk')
        return CourseTopic.objects.filter(
            course_id=course_id,
            course__user=self.request.user
        ).select_related('course')

    def get_course(self):
        """Get the course instance for these topics."""
        course_id = self.kwargs.get('course_pk')
        return get_object_or_404(
            Course,
            id=course_id,
            user=self.request.user
        )

    def perform_create(self, serializer):
        """Create course topics for the specified course with RAG processing."""
        course = self.get_course()
        course_topic = serializer.save(course=course)
        
        # Process through RAG pipeline for topic extraction
        self._process_topics_with_rag(course_topic)

    def perform_update(self, serializer):
        """Update course topics with RAG processing if content changed."""
        course_topic = serializer.save()
        
        # Re-process if content changed
        if 'syllabus_text' in serializer.validated_data or 'syllabus_file' in serializer.validated_data:
            course_topic.is_processed = False
            course_topic.extracted_topics = []
            course_topic.topics_summary = ""
            course_topic.save()
            
            self._process_topics_with_rag(course_topic)

    def _process_topics_with_rag(self, course_topic):
        """Process syllabus content through RAG pipeline for topic extraction."""
        if not RAG_AVAILABLE or CourseRAGExtension is None:
            logger.warning("RAG pipeline not available - topic processing skipped")
            course_topic.processing_error = "RAG pipeline not available"
            course_topic.save()
            return
            
        try:
            # Process the course topics using pre-imported CourseRAGExtension
            CourseRAGExtension.process_course_topics(course_topic)
            logger.info(f"Successfully processed course topics {course_topic.id} through RAG pipeline")
            
        except Exception as e:
            logger.error(f"Error processing course topics {course_topic.id} through RAG: {str(e)}")
            course_topic.processing_error = str(e)
            course_topic.save()

    @extend_schema(
        summary="Reprocess course topics",
        description="Reprocess syllabus content to extract topics.",
        responses={200: CourseTopicSerializer}
    )
    @action(detail=True, methods=['post'], url_path='reprocess')
    def reprocess(self, request, course_pk=None, pk=None):
        """Reprocess topics extraction."""
        course_topic = self.get_object()
        
        # Reset processing status
        course_topic.is_processed = False
        course_topic.extracted_topics = []
        course_topic.topics_summary = ""
        course_topic.processing_error = ""
        course_topic.save()
        
        # Reprocess
        self._process_topics_with_rag(course_topic)
        
        serializer = self.get_serializer(course_topic)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List course topic items",
        description="List all individual topic items for a specific course."
    ),
    create=extend_schema(
        summary="Create course topic item",
        description="Create a new individual topic item."
    ),
    retrieve=extend_schema(
        summary="Get course topic item",
        description="Get details of a specific topic item."
    ),
    update=extend_schema(
        summary="Update course topic item",
        description="Update a topic item's details."
    ),
    partial_update=extend_schema(
        summary="Partially update course topic item",
        description="Partially update a topic item's details."
    ),
    destroy=extend_schema(
        summary="Delete course topic item",
        description="Delete a topic item."
    )
)
class CourseTopicItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual course topic items.
    """
    serializer_class = CourseTopicItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter topic items by course and user."""
        course_pk = self.kwargs.get('course_pk')
        course = get_object_or_404(Course, pk=course_pk, user=self.request.user)
        return CourseTopicItem.objects.filter(course=course).order_by('order', 'created_at')

    def get_course(self):
        """Get the parent course."""
        course_pk = self.kwargs.get('course_pk')
        return get_object_or_404(Course, pk=course_pk, user=self.request.user)

    def perform_create(self, serializer):
        """Set the course when creating a topic item."""
        course = self.get_course()
        
        # Get the course_topic_pk from URL or request data
        course_topic_pk = self.request.data.get('course_topic') or self.kwargs.get('topics_pk')
        if course_topic_pk:
            course_topic = get_object_or_404(CourseTopic, pk=course_topic_pk, course=course)
        else:
            # If no specific course_topic, try to get the first one or create one
            course_topic = CourseTopic.objects.filter(course=course).first()
            if not course_topic:
                course_topic = CourseTopic.objects.create(
                    course=course,
                    syllabus_text="Manual topic entry",
                    topics_summary="Manually created topics",
                    is_processed=True
                )

        # Set the next order
        last_item = CourseTopicItem.objects.filter(course=course, course_topic=course_topic).order_by('-order').first()
        next_order = (last_item.order + 1) if last_item else 1

        serializer.save(
            course=course,
            course_topic=course_topic,
            order=next_order
        )

    @extend_schema(
        summary="Toggle topic completion",
        description="Mark a topic as completed or uncompleted.",
        responses={200: CourseTopicItemSerializer}
    )
    @action(detail=True, methods=['post'], url_path='toggle-completion')
    def toggle_completion(self, request, course_pk=None, pk=None):
        """Toggle the completion status of a topic."""
        topic_item = self.get_object()
        topic_item.is_completed = not topic_item.is_completed
        topic_item.save()
        
        serializer = self.get_serializer(topic_item)
        return Response(serializer.data)

    @extend_schema(
        summary="Reorder topic items",
        description="Reorder topic items within a course.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'topic_orders': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'integer'},
                                'order': {'type': 'integer'}
                            }
                        }
                    }
                }
            }
        },
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request, course_pk=None):
        """Reorder topic items."""
        course = self.get_course()
        topic_orders = request.data.get('topic_orders', [])
        
        for item_data in topic_orders:
            topic_id = item_data.get('id')
            new_order = item_data.get('order')
            
            try:
                topic_item = CourseTopicItem.objects.get(id=topic_id, course=course)
                topic_item.order = new_order
                topic_item.save()
            except CourseTopicItem.DoesNotExist:
                continue
        
        return Response({'message': 'Topics reordered successfully'})
