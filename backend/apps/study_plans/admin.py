"""
Admin configuration for the study_plans app.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone

from .models import StudyPlan


@admin.register(StudyPlan)
class StudyPlanAdmin(admin.ModelAdmin):
    """
    Admin configuration for StudyPlan model.
    """
    list_display = (
        'title', 'course', 'user', 'status_display',
        'progress_display', 'duration_display', 'overdue_display',
        'created_at'
    )

    list_filter = (
        'status', 'start_date', 'end_date', 'created_at',
        'course__user', 'course'
    )

    search_fields = (
        'title', 'description', 'course__name',
        'user__username', 'user__email'
    )

    readonly_fields = (
        'is_active', 'is_overdue', 'days_remaining',
        'duration_days', 'days_elapsed', 'time_progress_percentage',
        'plan_summary_display', 'created_at', 'updated_at'
    )

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'course', 'title', 'description')
        }),
        ('Timeline', {
            'fields': (
                'start_date', 'end_date', 'duration_days',
                'days_elapsed', 'days_remaining'
            )
        }),
        ('Status & Progress', {
            'fields': (
                'status', 'progress_percentage', 'is_active',
                'is_overdue', 'time_progress_percentage'
            )
        }),
        ('Plan Data', {
            'fields': ('plan_data', 'plan_summary_display'),
            'classes': ('collapse',)
        }),
        ('Vector Search', {
            'fields': ('plan_embedding',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    date_hierarchy = 'start_date'

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user', 'course')

    def status_display(self, obj):
        """Display status with color coding."""
        status_colors = {
            'draft': '#6c757d',      # Gray
            'active': '#28a745',     # Green
            'completed': '#007bff',  # Blue
            'paused': '#ffc107',     # Yellow
            'cancelled': '#dc3545',  # Red
        }

        color = status_colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def progress_display(self, obj):
        """Display progress as a colored progress bar."""
        progress = float(obj.progress_percentage)

        if progress == 0:
            color = '#dc3545'  # Red
        elif progress < 25:
            color = '#fd7e14'  # Orange
        elif progress < 50:
            color = '#ffc107'  # Yellow
        elif progress < 75:
            color = '#20c997'  # Teal
        else:
            color = '#28a745'  # Green

        return format_html(
            '<div style="width: 100px; background-color: #f8f9fa; border-radius: 4px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 4px; '
            'text-align: center; color: white; font-size: 11px; line-height: 20px;">'
            '{}%</div></div>',
            progress, color, progress
        )
    progress_display.short_description = 'Progress'

    def duration_display(self, obj):
        """Display plan duration information."""
        if obj.duration_days:
            return format_html(
                '<strong>{} days</strong><br>'
                '<small>{} elapsed, {} remaining</small>',
                obj.duration_days,
                obj.days_elapsed,
                obj.days_remaining or 0
            )
        return '-'
    duration_display.short_description = 'Duration'

    def overdue_display(self, obj):
        """Display overdue status."""
        if obj.is_overdue:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">⚠️ Overdue</span>'
            )
        elif obj.days_remaining is not None and obj.days_remaining <= 7:
            return format_html(
                '<span style="color: #ffc107; font-weight: bold;">⏰ Due Soon</span>'
            )
        return format_html('<span style="color: #28a745;">✓ On Track</span>')
    overdue_display.short_description = 'Due Status'

    def plan_summary_display(self, obj):
        """Display plan summary in a formatted way."""
        summary = obj.get_plan_summary()
        if not summary:
            return "No plan data"

        return format_html(
            '<ul style="margin: 0; padding-left: 20px;">'
            '<li>Topics: {}</li>'
            '<li>Milestones: {}</li>'
            '<li>Estimated Hours: {}</li>'
            '<li>Difficulty: {}/5</li>'
            '</ul>',
            summary.get('total_topics', 0),
            summary.get('total_milestones', 0),
            summary.get('estimated_hours', 0),
            summary.get('difficulty_level', 3)
        )
    plan_summary_display.short_description = 'Plan Summary'

    def save_model(self, request, obj, form, change):
        """Override save to ensure user is set correctly."""
        if not change:  # Creating new object
            if not obj.user_id:
                obj.user = request.user
        super().save_model(request, obj, form, change)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter choices based on user permissions."""
        if db_field.name == "course":
            if not request.user.is_superuser:
                # Non-superusers can only assign study plans to their own courses
                kwargs["queryset"] = Course.objects.filter(user=request.user)

        if db_field.name == "user":
            if not request.user.is_superuser:
                # Non-superusers can only create plans for themselves
                kwargs["queryset"] = User.objects.filter(id=request.user.id)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_readonly_fields(self, request, obj=None):
        """Make user field readonly for non-superusers."""
        readonly_fields = list(self.readonly_fields)

        if not request.user.is_superuser:
            if 'user' not in readonly_fields:
                readonly_fields.append('user')

        return readonly_fields
