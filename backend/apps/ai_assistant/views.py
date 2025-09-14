"""
Views for the ai_assistant app.
"""

import time
from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from apps.courses.models import Course
from utils.ai_client import AIClient
from utils.enhanced_ai_client import EnhancedAIClient
from .serializers import (
    ExplainRequestSerializer,
    ExplainResponseSerializer,
    StudyPlanRequestSerializer,
    StudyPlanResponseSerializer,
    SemanticSearchRequestSerializer,
    SemanticSearchResponseSerializer,
    StudyRecommendationRequestSerializer,
    StudyRecommendationResponseSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
    AIServiceStatusSerializer
)


@extend_schema_view(
    explain=extend_schema(
        summary="Get AI explanation",
        description="Get an AI-generated explanation of a topic.",
        request=ExplainRequestSerializer,
        responses={200: ExplainResponseSerializer}
    ),
    enhanced_study_plan=extend_schema(
        summary="Generate enhanced study plan",
        description="Generate an AI-powered study plan for a course.",
        request=StudyPlanRequestSerializer,
        responses={200: StudyPlanResponseSerializer}
    ),
    semantic_search=extend_schema(
        summary="Semantic search",
        description="Perform semantic search on resources using AI.",
        request=SemanticSearchRequestSerializer,
        responses={200: SemanticSearchResponseSerializer}
    ),
    recommendations=extend_schema(
        summary="Get study recommendations",
        description="Get AI-powered study recommendations.",
        request=StudyRecommendationRequestSerializer,
        responses={200: StudyRecommendationResponseSerializer}
    ),
    chat=extend_schema(
        summary="Chat with AI assistant",
        description="Chat with the AI study assistant.",
        request=ChatRequestSerializer,
        responses={200: ChatResponseSerializer}
    ),
    status=extend_schema(
        summary="Get AI service status",
        description="Get the status of AI services.",
        responses={200: AIServiceStatusSerializer}
    )
)
class AIAssistantViewSet(viewsets.GenericViewSet):
    """
    ViewSet for AI Assistant functionality.

    Provides AI-powered features like explanations, study plans, and recommendations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ai_client = AIClient()
        self.enhanced_ai_client = EnhancedAIClient()

    @action(detail=False, methods=['post'])
    def explain(self, request):
        """Get AI explanation of a topic."""
        serializer = ExplainRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data['topic']
        context = serializer.validated_data.get('context', '')
        difficulty_level = serializer.validated_data.get('difficulty_level', 3)
        explanation_type = serializer.validated_data.get(
            'explanation_type', 'detailed')

        try:
            explanation = self.ai_client.generate_explanation(
                topic=topic,
                context=context,
                difficulty_level=difficulty_level,
                explanation_type=explanation_type
            )

            response_data = {
                'topic': topic,
                'explanation': explanation,
                'difficulty_level': difficulty_level,
                'explanation_type': explanation_type,
                'generated_at': timezone.now(),
                'service_used': 'gemini'
            }

            response_serializer = ExplainResponseSerializer(response_data)
            return Response(response_serializer.data)

        except Exception as e:
            return Response(
                {
                    'error': 'Failed to generate explanation',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='enhanced-study-plan')
    def enhanced_study_plan(self, request):
        """Generate an enhanced study plan using AI."""
        serializer = StudyPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course_id = serializer.validated_data['course_id']
        preferences = serializer.validated_data.get('preferences', {})
        duration_weeks = serializer.validated_data.get('duration_weeks', 4)
        study_hours_per_week = serializer.validated_data.get(
            'study_hours_per_week', 5)
        focus_areas = serializer.validated_data.get('focus_areas', [])
        difficulty_preference = serializer.validated_data.get(
            'difficulty_preference', 3)

        try:
            # Get course information
            course = Course.objects.get(id=course_id, user=request.user)

            # Gather course data
            course_info = {
                'name': course.name,
                'code': course.code,
                'description': course.description,
                'syllabus_text': course.syllabus_text,
                'difficulty_level': course.difficulty_level,
                'credits': course.credits,
                'start_date': course.start_date.isoformat() if course.start_date else None,
                'end_date': course.end_date.isoformat() if course.end_date else None,
            }

            # Get assignments
            assignments = []
            for assignment in course.assignments.all():
                assignments.append({
                    'title': assignment.title,
                    'type': assignment.assignment_type,
                    'due_date': assignment.due_date.isoformat(),
                    'estimated_hours': float(assignment.estimated_hours) if assignment.estimated_hours else None,
                    'weight': float(assignment.weight) if assignment.weight else None,
                })

            # Generate study plan
            plan_data = self.enhanced_ai_client.generate_enhanced_study_plan(
                course_info=course_info,
                assignments=assignments,
                preferences={
                    **preferences,
                    'duration_weeks': duration_weeks,
                    'study_hours_per_week': study_hours_per_week,
                    'focus_areas': focus_areas,
                    'difficulty_preference': difficulty_preference,
                }
            )

            response_data = {
                'success': True,
                'plan': plan_data,
                'service_used': self.enhanced_ai_client.get_service_info()['primary_service'],
                'generated_at': timezone.now(),
                'course_id': course_id,
                'estimated_total_hours': duration_weeks * study_hours_per_week,
                'message': 'Study plan generated successfully'
            }

            response_serializer = StudyPlanResponseSerializer(response_data)
            return Response(response_serializer.data)

        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found or you do not have access to it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': 'Failed to generate study plan',
                    'details': str(e),
                    'service_used': 'error',
                    'generated_at': timezone.now(),
                    'course_id': course_id,
                    'message': 'Study plan generation failed'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='semantic-search')
    def semantic_search(self, request):
        """Perform semantic search on resources."""
        serializer = SemanticSearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data['query']
        resource_type = serializer.validated_data.get('resource_type')
        limit = serializer.validated_data.get('limit', 10)
        similarity_threshold = serializer.validated_data.get(
            'similarity_threshold', 0.5)

        start_time = time.time()

        try:
            results = self.enhanced_ai_client.semantic_search(
                query=query,
                filters={
                    'resource_type': resource_type,
                    'limit': limit,
                    'similarity_threshold': similarity_threshold
                }
            )

            search_time_ms = int((time.time() - start_time) * 1000)

            response_data = {
                'results': results.get('results', []),
                'query': query,
                'total_results': len(results.get('results', [])),
                'service_used': results.get('service_used', 'fallback'),
                'search_time_ms': search_time_ms
            }

            response_serializer = SemanticSearchResponseSerializer(
                response_data)
            return Response(response_serializer.data)

        except Exception as e:
            search_time_ms = int((time.time() - start_time) * 1000)
            return Response(
                {
                    'error': 'Semantic search failed',
                    'details': str(e),
                    'query': query,
                    'search_time_ms': search_time_ms
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def recommendations(self, request):
        """Get AI-powered study recommendations."""
        serializer = StudyRecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data.get('user_id', request.user.id)
        course_ids = serializer.validated_data.get('course_ids', [])
        topics = serializer.validated_data.get('topics', [])
        difficulty_level = serializer.validated_data.get('difficulty_level')
        resource_types = serializer.validated_data.get('resource_types', [])
        limit = serializer.validated_data.get('limit', 5)

        try:
            # Get user context
            user_context = {
                'user_id': user_id,
                'courses': [],
                'preferences': request.user.study_preferences if hasattr(request.user, 'study_preferences') else {}
            }

            # Add course information if course_ids provided
            if course_ids:
                courses = Course.objects.filter(
                    id__in=course_ids, user=request.user)
                user_context['courses'] = [
                    {
                        'id': course.id,
                        'name': course.name,
                        'subject': course.description[:100] if course.description else '',
                        'difficulty_level': course.difficulty_level
                    }
                    for course in courses
                ]

            recommendations = self.enhanced_ai_client.generate_recommendations(
                user_context=user_context,
                filters={
                    'topics': topics,
                    'difficulty_level': difficulty_level,
                    'resource_types': resource_types,
                    'limit': limit
                }
            )

            response_data = {
                'recommendations': recommendations.get('recommendations', []),
                'reasoning': recommendations.get('reasoning', 'Based on your study preferences and course history.'),
                'confidence_score': recommendations.get('confidence_score', 0.7),
                'service_used': recommendations.get('service_used', 'enhanced_ai'),
                'generated_at': timezone.now()
            }

            response_serializer = StudyRecommendationResponseSerializer(
                response_data)
            return Response(response_serializer.data)

        except Exception as e:
            return Response(
                {
                    'error': 'Failed to generate recommendations',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def chat(self, request):
        """Chat with AI assistant."""
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        context = serializer.validated_data.get('context', {})
        course_id = serializer.validated_data.get('course_id')

        start_time = time.time()

        try:
            # Add user context
            user_context = {
                'user_id': request.user.id,
                'username': request.user.username,
                'preferences': getattr(request.user, 'study_preferences', {}),
            }

            # Add course context if provided
            if course_id:
                try:
                    course = Course.objects.get(
                        id=course_id, user=request.user)
                    user_context['current_course'] = {
                        'name': course.name,
                        'description': course.description,
                        'difficulty_level': course.difficulty_level
                    }
                except Course.DoesNotExist:
                    pass

            response_text = self.ai_client.chat_with_assistant(
                message=message,
                context={**context, **user_context}
            )

            response_time_ms = int((time.time() - start_time) * 1000)

            response_data = {
                'response': response_text,
                'context': {**context, 'last_message': message},
                'service_used': 'gemini',
                'response_time_ms': response_time_ms,
                'generated_at': timezone.now()
            }

            response_serializer = ChatResponseSerializer(response_data)
            return Response(response_serializer.data)

        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            return Response(
                {
                    'error': 'Chat failed',
                    'details': str(e),
                    'response_time_ms': response_time_ms
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get AI service status."""
        try:
            service_status = {
                'gemini_available': bool(settings.GOOGLE_GEMINI_API_KEY),
                'vector_search_enabled': getattr(settings, 'USE_VECTOR_SEARCH', False),
                'embedding_service': getattr(settings, 'EMBEDDING_SERVICE', 'local'),
                'cache_enabled': 'redis' in settings.CACHES.get('default', {}).get('BACKEND', ''),
                'fallback_enabled': getattr(settings, 'AI_FALLBACK_ENABLED', True),
                'last_health_check': timezone.now(),
                'services': {
                    'gemini': {
                        'status': 'available' if settings.GOOGLE_GEMINI_API_KEY else 'unavailable',
                        'features': ['explanations', 'chat', 'study_plans']
                    },
                    'vector_search': {
                        'status': 'enabled' if getattr(settings, 'USE_VECTOR_SEARCH', False) else 'disabled',
                        'features': ['semantic_search', 'recommendations']
                    },
                    'enhanced_ai': {
                        'status': 'available',
                        'features': ['study_plans', 'recommendations', 'semantic_search']
                    }
                }
            }

            # Test basic AI functionality
            try:
                test_response = self.ai_client.generate_explanation(
                    topic="test",
                    context="",
                    difficulty_level=1
                )
                service_status['services']['gemini']['last_test'] = timezone.now(
                ).isoformat()
                service_status['services']['gemini']['test_status'] = 'success'
            except Exception as e:
                service_status['services']['gemini']['test_status'] = 'failed'
                service_status['services']['gemini']['test_error'] = str(e)

            response_serializer = AIServiceStatusSerializer(service_status)
            return Response(response_serializer.data)

        except Exception as e:
            return Response(
                {
                    'error': 'Failed to get service status',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
