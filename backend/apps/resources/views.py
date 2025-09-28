"""
Views for the resources app.
"""

import logging
import os
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

logger = logging.getLogger(__name__)

from .models import Resource, ResourceRating, ResourceCollection
from .serializers import (
    ResourceSerializer,
    ResourceCreateSerializer,
    ResourceRatingSerializer,
    ResourceCollectionSerializer,
    ResourceCollectionDetailSerializer,
    ResourceStatsSerializer,
    ResourceSearchSerializer,
    SemanticSearchRequestSerializer,
    AIStudyPlanRequestSerializer,
    AIStudyPlanResponseSerializer,
    AIQuestionRequestSerializer,
    AIQuestionResponseSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List resources",
        description="Retrieve a list of study resources with filtering and search."
    ),
    create=extend_schema(
        summary="Create a new resource",
        description="Create a new study resource.",
        request=ResourceCreateSerializer
    ),
    retrieve=extend_schema(
        summary="Get resource details",
        description="Retrieve detailed information about a specific resource."
    ),
    update=extend_schema(
        summary="Update resource",
        description="Update a resource's information."
    ),
    destroy=extend_schema(
        summary="Delete resource",
        description="Delete a resource."
    )
)
class ResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Resource model.

    Provides CRUD operations and search functionality for resources.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['resource_type', 'subject',
                        'difficulty_level', 'is_verified']
    search_fields = ['title', 'description', 'subject', 'topics']
    ordering_fields = ['created_at', 'rating', 'view_count', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return all resources with related data."""
        return Resource.objects.select_related('added_by_user').all()

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'create':
            return ResourceCreateSerializer
        return ResourceSerializer

    def create(self, request, *args, **kwargs):
        """Create a new resource and process it through RAG pipeline if it's a file."""
        # Get the uploaded file from the request
        uploaded_file = request.FILES.get('file')
        
        # Create the resource without the file field
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set file metadata if file was uploaded
        if uploaded_file:
            file_size = uploaded_file.size
            file_type = os.path.splitext(uploaded_file.name)[1].lower().lstrip('.')
            original_filename = uploaded_file.name
            
            # Save resource with metadata
            resource = serializer.save(
                added_by_user=request.user,
                original_filename=original_filename,
                resource_type=file_type if file_type in ['pdf', 'docx', 'txt'] else serializer.validated_data.get('resource_type', 'other')
            )
            
            # Process through RAG pipeline if it's a supported file type
            if file_type in ['pdf', 'docx', 'txt']:
                try:
                    self._process_resource_with_rag(resource, uploaded_file)
                except Exception as e:
                    logger.error(f"Error processing resource {resource.id} through RAG: {str(e)}")
        else:
            # No file uploaded, just create the resource
            resource = serializer.save(added_by_user=request.user)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def _process_resource_with_rag(self, resource, uploaded_file):
        """Process resource through RAG pipeline from uploaded file."""
        try:
            from .rag_models import Document, DocumentChunk
            from .rag_pipeline import DocumentProcessor, EmbeddingGenerator
            
            # Extract text from the uploaded file
            file_type = resource.resource_type or 'pdf'
            content = DocumentProcessor.extract_text_from_uploaded_file(uploaded_file, file_type)
            if not content or len(content.strip()) < 100:
                logger.warning(f"Insufficient content extracted from resource {resource.id}")
                return
            
            # Create a Document entry for the resource
            document = Document.objects.create(
                title=f"Resource: {resource.title}",
                content=content[:10000],  # Store first 10k chars
                document_type='resource',
                source_url='',  # No file URL since we're not storing files
                metadata={
                    'resource_id': resource.id,
                    'resource_type': resource.resource_type,
                    'course_id': resource.course.id if resource.course else None,
                    'original_filename': resource.original_filename
                }
            )
            
            # Chunk the content
            chunks = DocumentProcessor.intelligent_chunk_text(content, chunk_size=1500)
            
            # Process each chunk
            for i, chunk_data in enumerate(chunks):
                chunk_text = chunk_data['content']
                if len(chunk_text.strip()) < 50:
                    continue
                    
                # Generate embedding for the chunk
                try:
                    embedding = EmbeddingGenerator.generate_embedding(chunk_text)
                    if not embedding:
                        continue
                    
                    # Create DocumentChunk
                    DocumentChunk.objects.create(
                        document=document,
                        content=chunk_text,
                        chunk_index=i,
                        start_char=chunk_data.get('start_char', 0),
                        end_char=chunk_data.get('end_char', len(chunk_text)),
                        embedding=embedding,
                        metadata={
                            'resource_id': resource.id,
                            'course_id': resource.course.id if resource.course else None,
                            'chunk_type': 'resource_content'
                        }
                    )
                    
                except Exception as e:
                    logger.error(f"Error processing chunk {i} for resource {resource.id}: {str(e)}")
                    continue
            
            logger.info(f"Successfully processed resource {resource.id} with {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"Error processing resource {resource.id} through RAG: {str(e)}")
            raise

    def retrieve(self, request, *args, **kwargs):
        """Retrieve resource and increment view count."""
        instance = self.get_object()
        instance.increment_view_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(
        summary="Get resource statistics",
        description="Get statistics about all resources in the system.",
        responses={200: ResourceStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get resource statistics."""
        queryset = self.get_queryset()

        stats = {
            'total_resources': queryset.count(),
            'verified_resources': queryset.filter(is_verified=True).count(),
            'resources_by_type': dict(
                queryset.values('resource_type').annotate(
                    count=Count('id')
                ).values_list('resource_type', 'count')
            ),
            'resources_by_difficulty': dict(
                queryset.values('difficulty_level').annotate(
                    count=Count('id')
                ).values_list('difficulty_level', 'count')
            ),
            'average_rating': queryset.aggregate(
                avg_rating=Avg('rating')
            )['avg_rating'] or 0,
            'total_views': queryset.aggregate(
                total_views=Count('view_count')
            )['total_views'] or 0,
        }

        serializer = ResourceStatsSerializer(stats)
        return Response(serializer.data)

    @extend_schema(
        summary="Search resources",
        description="Search resources with advanced filtering.",
        request=ResourceSearchSerializer,
        responses={200: ResourceSerializer(many=True)}
    )
    @action(detail=False, methods=['post'])
    def search(self, request):
        """Advanced resource search."""
        serializer = ResourceSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data['query']
        resource_type = serializer.validated_data.get('resource_type')
        subject = serializer.validated_data.get('subject')
        difficulty_level = serializer.validated_data.get('difficulty_level')
        min_rating = serializer.validated_data.get('min_rating')
        verified_only = serializer.validated_data.get('verified_only', False)
        limit = serializer.validated_data.get('limit', 20)

        # Build filter conditions
        queryset = self.get_queryset()

        # Text search
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(subject__icontains=query) |
                Q(topics__icontains=query)
            )

        # Apply filters
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        if subject:
            queryset = queryset.filter(subject__icontains=subject)
        if difficulty_level:
            queryset = queryset.filter(difficulty_level=difficulty_level)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        if verified_only:
            queryset = queryset.filter(is_verified=True)

        # Order by relevance (view_count and rating)
        queryset = queryset.order_by('-rating', '-view_count')[:limit]

        serializer = ResourceSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get popular resources",
        description="Get most popular resources based on views and ratings.",
        responses={200: ResourceSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular resources."""
        limit = int(request.query_params.get('limit', 10))
        popular_resources = self.get_queryset().order_by(
            '-view_count', '-rating'
        )[:limit]

        serializer = self.get_serializer(popular_resources, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get recommended resources",
        description="Get recommended resources based on user preferences.",
        responses={200: ResourceSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """Get recommended resources for the user."""
        # Simple recommendation based on user's course subjects
        user_subjects = set()

        # Get subjects from user's courses
        if hasattr(request.user, 'courses'):
            for course in request.user.courses.all():
                if course.description:
                    # Simple subject extraction - in production, this would be more sophisticated
                    # Use first word as subject
                    user_subjects.add(course.name.split()[0])

        # Get resources matching user's subjects
        queryset = self.get_queryset()
        if user_subjects:
            q_objects = Q()
            for subject in user_subjects:
                q_objects |= Q(subject__icontains=subject)
            queryset = queryset.filter(q_objects)

        # Order by rating and verification status
        recommended = queryset.filter(
            is_verified=True
        ).order_by('-rating', '-view_count')[:10]

        serializer = self.get_serializer(recommended, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Generate AI-powered study plan",
        description="Generate a personalized study plan using RAG pipeline with uploaded resources.",
        request=AIStudyPlanRequestSerializer,
        responses={200: AIStudyPlanResponseSerializer}
    )
    @action(detail=False, methods=['post'], url_path='generate-study-plan')
    def generate_study_plan(self, request):
        """Generate AI-powered study plan using RAG with resource context."""
        serializer = AIStudyPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Import Course and StudyPlan models for exception handling
        from apps.courses.models import Course
        from apps.study_plans.models import StudyPlan
        
        try:
            # Initialize RAG pipeline (import only when needed)
            try:
                from .rag_pipeline import RAGPipeline
                rag_pipeline = RAGPipeline()
            except ImportError as e:
                logger.warning(f"RAG pipeline not available: {e}")
                return Response(
                    {
                        'success': False,
                        'error': 'AI features not available - missing dependencies',
                        'details': 'Please install required AI packages (openai, pgvector)'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Extract request data
            course_id = serializer.validated_data['course_id']
            query = serializer.validated_data['query']
            preferences = serializer.validated_data.get('preferences', {})
            
            # Get course
            course = Course.objects.get(id=course_id, user=request.user)
            
            # Generate study plan with RAG context
            study_plan = rag_pipeline.generate_contextual_study_plan(
                user=request.user,
                course=course,
                query=query,
                preferences=preferences
            )
            
            response_data = {
                'success': True,
                'study_plan': study_plan,
                'course_id': course_id,
                'query': query,
                'generated_at': timezone.now().isoformat(),
                'rag_context_used': True
            }
            
            response_serializer = AIStudyPlanResponseSerializer(response_data)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found or you do not have access to it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Study plan generation failed: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': 'Failed to generate study plan',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Ask AI a question about course content",
        description="Ask the AI assistant a question using RAG context from uploaded resources.",
        request=AIQuestionRequestSerializer,
        responses={200: AIQuestionResponseSerializer}
    )
    @action(detail=False, methods=['post'], url_path='ai-question')
    def ai_question(self, request):
        """Answer questions using RAG pipeline with resource context."""
        serializer = AIQuestionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Import Course model for exception handling
        from apps.courses.models import Course
        
        try:
            # Initialize RAG pipeline (import only when needed)
            try:
                from .rag_pipeline import RAGPipeline
                rag_pipeline = RAGPipeline()
            except ImportError as e:
                logger.warning(f"RAG pipeline not available: {e}")
                return Response(
                    {
                        'error': 'AI features not available - missing dependencies',
                        'details': 'Please install required AI packages (openai, pgvector)'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Extract request data
            question = serializer.validated_data['question']
            course_id = serializer.validated_data.get('course_id')
            context_type = serializer.validated_data.get('context_type', 'general')
            
            # Get course if provided
            course = None
            if course_id:
                course = Course.objects.get(id=course_id, user=request.user)
            
            # Get AI response with context
            response = rag_pipeline.answer_question_with_context(
                user=request.user,
                question=question,
                course=course,
                context_type=context_type
            )
            
            response_data = {
                'answer': response['answer'],
                'sources': response.get('sources', []),
                'confidence': response.get('confidence', 0.8),
                'question': question,
                'course_id': course_id,
                'context_type': context_type,
                'generated_at': timezone.now().isoformat(),
                'rag_context_used': True
            }
            
            response_serializer = AIQuestionResponseSerializer(response_data)
            return Response(response_serializer.data)
            
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found or you do not have access to it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"AI question answering failed: {str(e)}")
            return Response(
                {
                    'error': 'Failed to answer question',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Rate a resource",
        description="Rate a resource from 1 to 5 stars.",
        request=ResourceRatingSerializer,
        responses={201: ResourceRatingSerializer}
    )
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a resource."""
        resource = self.get_object()

        # Check if user already rated this resource
        existing_rating = ResourceRating.objects.filter(
            resource=resource,
            user=request.user
        ).first()

        serializer = ResourceRatingSerializer(
            existing_rating,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        if existing_rating:
            serializer.save()
            status_code = status.HTTP_200_OK
        else:
            serializer.save(resource=resource, user=request.user)
            status_code = status.HTTP_201_CREATED

        # Update resource average rating
        avg_rating = ResourceRating.objects.filter(
            resource=resource
        ).aggregate(avg_rating=Avg('rating'))['avg_rating']

        resource.rating = avg_rating
        resource.save(update_fields=['rating'])

        return Response(serializer.data, status=status_code)

    @extend_schema(
        summary="Get resource ratings",
        description="Get all ratings for a specific resource.",
        responses={200: ResourceRatingSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        """Get ratings for a resource."""
        resource = self.get_object()
        ratings = ResourceRating.objects.filter(
            resource=resource
        ).select_related('user').order_by('-created_at')

        serializer = ResourceRatingSerializer(ratings, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List user's resource collections",
        description="Retrieve a list of resource collections for the authenticated user."
    ),
    create=extend_schema(
        summary="Create a new resource collection",
        description="Create a new resource collection."
    ),
    retrieve=extend_schema(
        summary="Get collection details",
        description="Retrieve detailed information about a specific collection."
    ),
    update=extend_schema(
        summary="Update collection",
        description="Update a collection's information."
    ),
    destroy=extend_schema(
        summary="Delete collection",
        description="Delete a resource collection."
    )
)
class ResourceCollectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ResourceCollection model.

    Provides CRUD operations for resource collections.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return collections for the authenticated user or public collections."""
        return ResourceCollection.objects.filter(
            Q(user=self.request.user) | Q(is_public=True)
        ).prefetch_related('resources')

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'retrieve':
            return ResourceCollectionDetailSerializer
        return ResourceCollectionSerializer

    def perform_create(self, serializer):
        """Set the collection owner to the current user."""
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="Add resource to collection",
        description="Add a resource to the specified collection.",
        request={"resource_id": "integer"},
        responses={200: "Success message"}
    )
    @action(detail=True, methods=['post'], url_path='add-resource')
    def add_resource(self, request, pk=None):
        """Add a resource to this collection."""
        collection = self.get_object()
        resource_id = request.data.get('resource_id')

        if not resource_id:
            return Response(
                {'error': 'resource_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resource = Resource.objects.get(id=resource_id)
        except Resource.DoesNotExist:
            return Response(
                {'error': 'Resource not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection.resources.add(resource)
        return Response({'message': 'Resource added to collection'})

    @extend_schema(
        summary="Remove resource from collection",
        description="Remove a resource from the specified collection.",
        responses={200: "Success message"}
    )
    @action(detail=True, methods=['delete'], url_path='remove-resource/(?P<resource_id>[^/.]+)')
    def remove_resource(self, request, pk=None, resource_id=None):
        """Remove a resource from this collection."""
        collection = self.get_object()

        try:
            resource = Resource.objects.get(id=resource_id)
            collection.resources.remove(resource)
            return Response({'message': 'Resource removed from collection'})
        except Resource.DoesNotExist:
            return Response(
                {'error': 'Resource not found'},
                status=status.HTTP_404_NOT_FOUND
            )
