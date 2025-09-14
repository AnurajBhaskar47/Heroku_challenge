"""
Admin configuration for the resources app.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Avg

from .models import Resource, ResourceRating, ResourceCollection


class ResourceRatingInline(admin.TabularInline):
    """
    Inline admin for ResourceRating model within Resource admin.
    """
    model = ResourceRating
    extra = 0
    readonly_fields = ('user', 'rating', 'created_at')
    can_delete = False

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user')


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    """
    Admin configuration for Resource model.
    """
    list_display = (
        'title', 'resource_type', 'subject', 'difficulty_display',
        'rating_display', 'view_count', 'is_verified_display',
        'added_by_user', 'created_at'
    )

    list_filter = (
        'resource_type', 'difficulty_level', 'is_verified',
        'subject', 'created_at', 'added_by_user'
    )

    search_fields = (
        'title', 'description', 'subject', 'url',
        'added_by_user__username'
    )

    readonly_fields = (
        'view_count', 'rating', 'display_rating',
        'difficulty_display', 'is_external_resource',
        'topics_list', 'created_at', 'updated_at'
    )

    fieldsets = (
        ('Basic Information', {
            'fields': (
                'title', 'description', 'url', 'resource_type',
                'is_external_resource'
            )
        }),
        ('Classification', {
            'fields': ('subject', 'topics', 'topics_list', 'difficulty_level', 'difficulty_display')
        }),
        ('Quality & Verification', {
            'fields': (
                'estimated_time', 'rating', 'display_rating',
                'is_verified', 'added_by_user'
            )
        }),
        ('Usage Statistics', {
            'fields': ('view_count',),
            'classes': ('collapse',)
        }),
        ('Vector Search', {
            'fields': ('embedding',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    inlines = [ResourceRatingInline]

    actions = ['mark_verified', 'mark_unverified']

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('added_by_user')

    def rating_display(self, obj):
        """Display rating with stars."""
        if obj.rating is None:
            return format_html('<span style="color: #6c757d;">Not rated</span>')

        rating = float(obj.rating)
        stars = '★' * int(rating) + '☆' * (5 - int(rating))

        if rating >= 4.5:
            color = '#28a745'  # Green
        elif rating >= 3.5:
            color = '#17a2b8'  # Blue
        elif rating >= 2.5:
            color = '#ffc107'  # Yellow
        else:
            color = '#dc3545'  # Red

        return format_html(
            '<span style="color: {}; font-size: 16px;">{}</span> '
            '<small>({:.1f}/5.0)</small>',
            color, stars, rating
        )
    rating_display.short_description = 'Rating'

    def is_verified_display(self, obj):
        """Display verification status with icon."""
        if obj.is_verified:
            return format_html(
                '<span style="color: #28a745;">✓ Verified</span>'
            )
        return format_html(
            '<span style="color: #6c757d;">○ Unverified</span>'
        )
    is_verified_display.short_description = 'Verified'

    def mark_verified(self, request, queryset):
        """Mark selected resources as verified."""
        updated = queryset.update(is_verified=True)
        self.message_user(
            request,
            f'{updated} resources were marked as verified.'
        )
    mark_verified.short_description = 'Mark selected resources as verified'

    def mark_unverified(self, request, queryset):
        """Mark selected resources as unverified."""
        updated = queryset.update(is_verified=False)
        self.message_user(
            request,
            f'{updated} resources were marked as unverified.'
        )
    mark_unverified.short_description = 'Mark selected resources as unverified'


@admin.register(ResourceRating)
class ResourceRatingAdmin(admin.ModelAdmin):
    """
    Admin configuration for ResourceRating model.
    """
    list_display = (
        'resource', 'user', 'rating_display', 'has_review',
        'created_at'
    )

    list_filter = (
        'rating', 'created_at', 'resource__resource_type'
    )

    search_fields = (
        'resource__title', 'user__username', 'review'
    )

    readonly_fields = ('created_at', 'updated_at')

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('resource', 'user')

    def rating_display(self, obj):
        """Display rating with stars."""
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)

        colors = {
            5: '#28a745',  # Green
            4: '#17a2b8',  # Blue
            3: '#ffc107',  # Yellow
            2: '#fd7e14',  # Orange
            1: '#dc3545',  # Red
        }

        color = colors.get(obj.rating, '#6c757d')

        return format_html(
            '<span style="color: {}; font-size: 16px;">{}</span> '
            '<small>({}/5)</small>',
            color, stars, obj.rating
        )
    rating_display.short_description = 'Rating'

    def has_review(self, obj):
        """Check if rating has a review."""
        return bool(obj.review)
    has_review.boolean = True
    has_review.short_description = 'Has Review'


@admin.register(ResourceCollection)
class ResourceCollectionAdmin(admin.ModelAdmin):
    """
    Admin configuration for ResourceCollection model.
    """
    list_display = (
        'name', 'user', 'resource_count_display',
        'is_public_display', 'created_at'
    )

    list_filter = (
        'is_public', 'created_at', 'user'
    )

    search_fields = (
        'name', 'description', 'user__username'
    )

    readonly_fields = ('resource_count', 'created_at', 'updated_at')

    filter_horizontal = ('resources',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'description', 'is_public')
        }),
        ('Resources', {
            'fields': ('resources', 'resource_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user').prefetch_related('resources')

    def resource_count_display(self, obj):
        """Display resource count with link."""
        count = obj.resource_count
        if count > 0:
            return format_html(
                '<strong>{}</strong> resources',
                count
            )
        return '0 resources'
    resource_count_display.short_description = 'Resources'

    def is_public_display(self, obj):
        """Display public status with icon."""
        if obj.is_public:
            return format_html(
                '<span style="color: #28a745;">🌐 Public</span>'
            )
        return format_html(
            '<span style="color: #6c757d;">🔒 Private</span>'
        )
    is_public_display.short_description = 'Visibility'
