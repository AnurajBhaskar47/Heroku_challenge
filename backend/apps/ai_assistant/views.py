"""
Views for the ai_assistant app.
"""

import time
import logging
from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from apps.courses.models import Course, Exam
from utils.ai_client import AIClient
from utils.enhanced_ai_client import EnhancedAIClient
from utils.security_guards import ChatSecurityGuard, RateLimiter
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

# Configure logging
logger = logging.getLogger(__name__)


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
        """Chat with AI assistant using RAG pipeline for enhanced context."""
        try:
            # Rate limiting check
            if not RateLimiter.is_allowed(request.user.id, max_requests=30, window_minutes=60):
                return Response(
                    {
                        'error': 'Rate limit exceeded',
                        'details': 'Too many requests. Please wait before sending more messages.',
                        'retry_after': 3600  # 1 hour
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            serializer = ChatRequestSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            message = serializer.validated_data['message']
            context = serializer.validated_data.get('context', {})
            course_id = serializer.validated_data.get('course_id')

            # Security validation
            is_safe, error_message = ChatSecurityGuard.validate_message(message, request.user.id)
            if not is_safe:
                logger.warning(f"Blocked unsafe message from user {request.user.id}: {error_message}")
                return Response(
                    {
                        'response': error_message,
                        'context': {'last_message': message[:100]},
                        'service_used': 'security_guard',
                        'response_time_ms': 0,
                        'generated_at': timezone.now(),
                        'rag_enhanced': False,
                        'course_context_used': bool(course_id),
                        'security_blocked': True
                    }
                )

            start_time = time.time()
            logger.info(f"Processing chat request from user {request.user.id} for course {course_id}")
            
            # Add basic user context and sanitize
            user_context = ChatSecurityGuard.sanitize_context({
                'user_id': request.user.id,
                'username': request.user.username,
                'first_name': getattr(request.user, 'first_name', ''),
                'preferences': getattr(request.user, 'study_preferences', {}),
            })

            # Enhanced course context if provided
            if course_id:
                try:
                    course = Course.objects.get(id=course_id, user=request.user)
                    logger.info(f"Found course: {course.name}")
                    
                    # Basic course context (sanitized)
                    course_context = ChatSecurityGuard.sanitize_context({
                        'id': course.id,
                        'name': course.name,
                        'code': course.code,
                        'description': course.description,
                        'difficulty_level': course.difficulty_level
                    })
                    user_context['current_course'] = course_context

                    # Get basic course data with error handling
                    try:
                        # Get assignments count
                        assignments_count = course.assignments.count()
                        completed_assignments = course.assignments.filter(status='completed').count()
                        
                        # Get topic items count
                        topic_items_count = 0
                        completed_topics = 0
                        for course_topic in course.course_topics.all():
                            topic_items_count += course_topic.topic_items.count()
                            completed_topics += course_topic.topic_items.filter(is_completed=True).count()
                        
                        # Get exam data (scheduled assessments)
                        exams_count = course.exams.count()
                        upcoming_exams = course.exams.filter(
                            exam_date__gt=timezone.now(),
                            status='upcoming'
                        ).count()
                        completed_exams = course.exams.filter(status='completed').count()
                        
                        # Separate quizzes from other exams for clarity
                        upcoming_quizzes = course.exams.filter(
                            exam_date__gt=timezone.now(),
                            status='upcoming',
                            exam_type='quiz'
                        ).count()
                        
                        # Get quiz files count (uploaded study materials)
                        quiz_files_count = course.quiz_files.count()
                        
                        # Get upcoming exam details for context
                        upcoming_exam_details = []
                        for exam in course.exams.filter(
                            exam_date__gt=timezone.now(),
                            status='upcoming'
                        ).order_by('exam_date')[:5]:  # Get next 5 upcoming exams
                            exam_info = {
                                'name': exam.name,
                                'type': exam.exam_type,
                                'date': exam.exam_date.isoformat(),
                                'days_until': exam.days_until_exam,
                                'syllabus_coverage': exam.syllabus_coverage,
                                'preparation_percentage': exam.preparation_percentage
                            }
                            upcoming_exam_details.append(exam_info)
                        
                        user_context['course_stats'] = ChatSecurityGuard.sanitize_context({
                            'assignments_total': assignments_count,
                            'assignments_completed': completed_assignments,
                            'topics_total': topic_items_count,
                            'topics_completed': completed_topics,
                            'scheduled_exams_total': exams_count,
                            'scheduled_exams_upcoming': upcoming_exams,
                            'scheduled_exams_completed': completed_exams,
                            'scheduled_quizzes_upcoming': upcoming_quizzes,
                            'quiz_files_uploaded': quiz_files_count,
                            'upcoming_scheduled_assessments': upcoming_exam_details
                        })
                        
                    except Exception as stats_error:
                        logger.warning(f"Error loading course stats: {stats_error}")

                except Course.DoesNotExist:
                    logger.warning(f"Course {course_id} not found for user {request.user.id}")
                except Exception as course_error:
                    logger.error(f"Error loading course context: {course_error}")

            # Try to use RAG pipeline for context retrieval if available
            rag_context = ""
            rag_enhanced = False
            try:
                # Import RAG pipeline components here to avoid circular imports
                from apps.resources.rag_pipeline import RAGRetriever, EmbeddingGenerator
                
                if course_id:
                    logger.info(f"Attempting RAG search for course {course_id}")
                    # Generate embedding for the message
                    message_embedding = EmbeddingGenerator.generate_embedding(message)
                    
                    # Retrieve relevant chunks using RAG
                    context_info = RAGRetriever.retrieve_contextual_information(
                        user_id=request.user.id,
                        course_id=course_id,
                        query_text=message,
                        query_embedding=message_embedding
                    )
                    
                    if context_info and context_info.get('relevant_chunks'):
                        rag_context = "\n\nRelevant course content:\n"
                        for chunk in context_info['relevant_chunks'][:3]:  # Top 3 chunks
                            content = chunk.content[:200] if hasattr(chunk, 'content') else str(chunk)[:200]
                            rag_context += f"- {content}...\n"
                        
                        user_context['rag_results'] = context_info
                        rag_enhanced = True
                        logger.info(f"RAG search successful, found {len(context_info['relevant_chunks'])} relevant chunks")
                        
            except Exception as rag_error:
                logger.warning(f"RAG search failed: {rag_error}")
                # Continue without RAG context

            # Enhance the message with RAG context
            enhanced_message = message
            if rag_context:
                enhanced_message = f"{message}\n\nContext from course materials:{rag_context}"

            logger.info(f"Sending message to AI client: {enhanced_message[:100]}...")
            
            try:
                if not self.ai_client.available:
                    logger.error("AI client not available")
                    response_text = "I'm sorry, the AI service is currently unavailable. Please try again later."
                else:
                    # Sanitize all context before sending to AI
                    sanitized_context = ChatSecurityGuard.sanitize_context({**context, **user_context})
                    
                    # Use secure prompt creation
                    secure_prompt = ChatSecurityGuard.create_safe_prompt(enhanced_message, sanitized_context)
                    
                    # Call AI with secure prompt
                    response_text = self.ai_client._call_openai(secure_prompt)
                    logger.info(f"AI response received: {response_text[:100]}...")
                    
                    # Validate AI response before sending to user
                    is_response_safe, sanitized_response = ChatSecurityGuard.validate_response(response_text)
                    if not is_response_safe:
                        response_text = sanitized_response
                    else:
                        response_text = sanitized_response
                    
            except Exception as ai_error:
                logger.error(f"AI client error: {ai_error}")
                response_text = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."

            response_time_ms = int((time.time() - start_time) * 1000)

            response_data = {
                'response': response_text,
                'context': {**context, 'last_message': message},
                'service_used': 'openai',
                'response_time_ms': response_time_ms,
                'generated_at': timezone.now(),
                'rag_enhanced': rag_enhanced,
                'course_context_used': bool(course_id)
            }

            response_serializer = ChatResponseSerializer(response_data)
            return Response(response_serializer.data)

        except Exception as e:
            logger.error(f"Chat endpoint error: {e}", exc_info=True)
            response_time_ms = int((time.time() - start_time) * 1000) if 'start_time' in locals() else 0
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
