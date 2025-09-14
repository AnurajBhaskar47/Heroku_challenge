"""
Views for the accounts app.
"""

from rest_framework import status, permissions, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    LoginSerializer,
    PasswordChangeSerializer
)


@extend_schema_view(
    create=extend_schema(
        summary="Register a new user",
        description="Create a new user account with the provided information.",
        responses={
            201: OpenApiResponse(description="User successfully created"),
            400: OpenApiResponse(description="Validation error")
        }
    ),
    login=extend_schema(
        summary="Login user",
        description="Authenticate user and return JWT tokens.",
        responses={
            200: OpenApiResponse(description="Login successful"),
            400: OpenApiResponse(description="Invalid credentials")
        }
    ),
    logout=extend_schema(
        summary="Logout user",
        description="Logout current user and blacklist refresh token.",
        responses={
            200: OpenApiResponse(description="Logout successful")
        }
    )
)
class AuthViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    ViewSet for user authentication operations.

    Provides registration, login, and logout endpoints.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """Register a new user."""
        return self.register(request)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """Register a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)

        response_data = {
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """Login user with credentials."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='logout',
            permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        """Logout user and blacklist refresh token."""
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            logout(request)
            return Response(
                {'message': 'Successfully logged out'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Something went wrong during logout'},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema_view(
    retrieve=extend_schema(
        summary="Get current user profile",
        description="Retrieve the current authenticated user's profile information."
    ),
    partial_update=extend_schema(
        summary="Update user profile",
        description="Update the current authenticated user's profile information."
    ),
    change_password=extend_schema(
        summary="Change password",
        description="Change the current authenticated user's password."
    )
)
class UserViewSet(mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  viewsets.GenericViewSet):
    """
    ViewSet for user profile management.

    Provides endpoints for viewing and updating user profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return the current authenticated user."""
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        """Get current user's profile."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update current user's profile (full update)."""
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Update current user's profile (partial update)."""
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Change user password."""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )


class HealthCheckView(APIView):
    """
    Simple health check endpoint for monitoring.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Return health status."""
        return Response({
            'status': 'healthy',
            'message': 'Study Bud API is running'
        })


# Custom JWT views for better error handling and documentation
@extend_schema(
    summary="Obtain JWT token pair",
    description="Get access and refresh tokens using username and password."
)
class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with better documentation."""
    pass


@extend_schema(
    summary="Refresh JWT access token",
    description="Get a new access token using a valid refresh token."
)
class CustomTokenRefreshView(TokenRefreshView):
    """Custom JWT token refresh view with better documentation."""
    pass
