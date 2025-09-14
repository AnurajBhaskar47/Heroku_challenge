"""
Views for the resources app.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .models import Resource, ResourceRating, ResourceCollection
from .serializers import (
    ResourceSerializer,
    ResourceCreateSerializer,
    ResourceRatingSerializer,
    ResourceCollectionSerializer,
    ResourceCollectionDetailSerializer,
    ResourceStatsSerializer,
    ResourceSearchSerializer,
    SemanticSearchRequestSerializer
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
