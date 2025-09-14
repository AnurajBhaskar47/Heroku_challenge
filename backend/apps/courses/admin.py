"""
Admin configuration for the courses app.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import Course, Assignment


class AssignmentInline(admin.TabularInline):
    """
    Inline admin for Assignment model within Course admin.
    """
    model = Assignment
    extra = 0
    fields = ('title', 'assignment_type', 'due_date', 'status', 'grade')
    readonly_fields = ('is_overdue',)

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('course')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """
    Admin configuration for Course model.
    """
    list_display = (
        'name', 'code', 'user', 'instructor', 'credits',
        'difficulty_level', 'assignment_count_display', 'progress_display',
        'is_active', 'created_at'
    )

    list_filter = (
        'is_active', 'difficulty_level', 'credits', 'semester',
        'created_at', 'user'
    )

    search_fields = (
        'name', 'code', 'instructor', 'user__username', 'user__email'
    )

    readonly_fields = (
        'assignment_count', 'completed_assignment_count',
        'progress_percentage', 'created_at', 'updated_at'
    )

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'code', 'description', 'instructor')
        }),
        ('Academic Details', {
            'fields': ('credits', 'semester', 'difficulty_level', 'is_active')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date', 'class_schedule'),
            'classes': ('collapse',)
        }),
        ('Content', {
            'fields': ('syllabus_text',),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': (
                'assignment_count', 'completed_assignment_count',
                'progress_percentage'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    inlines = [AssignmentInline]

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user').prefetch_related('assignments')

    def assignment_count_display(self, obj):
        """Display assignment count with link."""
        count = obj.assignment_count
        if count > 0:
            url = reverse('admin:courses_assignment_changelist')
            return format_html(
                '<a href="{}?course__id__exact={}">{}</a>',
                url, obj.id, count
            )
        return count
    assignment_count_display.short_description = 'Assignments'

    def progress_display(self, obj):
        """Display progress as a colored bar."""
        progress = obj.progress_percentage
        if progress == 0:
            color = '#dc3545'  # Red
        elif progress < 50:
            color = '#ffc107'  # Yellow
        elif progress < 80:
            color = '#17a2b8'  # Blue
        else:
            color = '#28a745'  # Green

        return format_html(
            '<div style="width: 100px; background-color: #f8f9fa;">'
            '<div style="width: {}%; background-color: {}; height: 20px; text-align: center; color: white; font-size: 12px; line-height: 20px;">'
            '{}%</div></div>',
            progress, color, progress
        )
    progress_display.short_description = 'Progress'


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    """
    Admin configuration for Assignment model.
    """
    list_display = (
        'title', 'course', 'assignment_type', 'due_date',
        'status_display', 'grade_display', 'is_overdue_display',
        'created_at'
    )

    list_filter = (
        'assignment_type', 'status', 'course', 'due_date',
        'created_at', 'course__user'
    )

    search_fields = (
        'title', 'course__name', 'course__code',
        'course__user__username'
    )

    readonly_fields = (
        'is_overdue', 'days_until_due', 'time_until_due',
        'created_at', 'updated_at'
    )

    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'assignment_type', 'description')
        }),
        ('Scheduling', {
            'fields': (
                'due_date', 'estimated_hours',
                'is_overdue', 'days_until_due', 'time_until_due'
            )
        }),
        ('Grading', {
            'fields': ('weight', 'grade', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    date_hierarchy = 'due_date'

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('course', 'course__user')

    def status_display(self, obj):
        """Display status with color coding."""
        status_colors = {
            'not_started': '#6c757d',  # Gray
            'in_progress': '#17a2b8',  # Blue
            'submitted': '#ffc107',    # Yellow
            'completed': '#28a745',    # Green
            'overdue': '#dc3545',      # Red
        }

        color = status_colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def grade_display(self, obj):
        """Display grade with color coding."""
        if obj.grade is None:
            return '-'

        grade = float(obj.grade)
        if grade >= 90:
            color = '#28a745'  # Green
        elif grade >= 80:
            color = '#17a2b8'  # Blue
        elif grade >= 70:
            color = '#ffc107'  # Yellow
        else:
            color = '#dc3545'  # Red

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, grade
        )
    grade_display.short_description = 'Grade'

    def is_overdue_display(self, obj):
        """Display overdue status with icon."""
        if obj.is_overdue:
            return format_html(
                '<span style="color: #dc3545;">⚠️ Overdue</span>'
            )
        return format_html('<span style="color: #28a745;">✓ On time</span>')
    is_overdue_display.short_description = 'Due Status'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter course choices to show only user's courses."""
        if db_field.name == "course":
            if not request.user.is_superuser:
                kwargs["queryset"] = Course.objects.filter(user=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
