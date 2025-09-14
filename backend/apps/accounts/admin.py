"""
Admin configuration for the accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin configuration for the custom User model.
    """

    # Fields to display in the user list
    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'year_of_study', 'major', 'is_staff', 'is_active', 'date_joined'
    )

    # Fields to filter by
    list_filter = (
        'is_staff', 'is_superuser', 'is_active', 'year_of_study',
        'date_joined', 'groups'
    )

    # Fields to search by
    search_fields = ('username', 'first_name', 'last_name', 'email', 'major')

    # Default ordering
    ordering = ('-date_joined',)

    # Fields to filter by (right sidebar)
    filter_horizontal = ('groups', 'user_permissions')

    # Fieldsets for the user detail/edit page
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {
            'fields': ('first_name', 'last_name', 'email')
        }),
        (_('Academic info'), {
            'fields': ('year_of_study', 'major', 'timezone', 'study_preferences')
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        (_('Important dates'), {
            'fields': ('last_login', 'date_joined')
        }),
    )

    # Fields for adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name'
            )
        }),
        (_('Academic info'), {
            'classes': ('wide',),
            'fields': ('year_of_study', 'major', 'timezone')
        }),
    )

    # Read-only fields
    readonly_fields = ('date_joined', 'last_login')

    def get_queryset(self, request):
        """Optimize queryset to reduce database queries."""
        return super().get_queryset(request).select_related().prefetch_related('groups')

    def get_form(self, request, obj=None, **kwargs):
        """Customize form based on user permissions."""
        form = super().get_form(request, obj, **kwargs)

        # Non-superusers can't edit superuser status
        if not request.user.is_superuser:
            if 'is_superuser' in form.base_fields:
                form.base_fields['is_superuser'].disabled = True

        return form
