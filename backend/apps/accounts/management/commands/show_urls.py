"""
Django management command to display all available URLs.
"""

from django.core.management.base import BaseCommand
from django.urls import get_resolver
from django.conf import settings
import re


class Command(BaseCommand):
    help = 'Display all available URLs in the project'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            choices=['table', 'list', 'json'],
            default='table',
            help='Output format (default: table)'
        )
        parser.add_argument(
            '--filter',
            help='Filter URLs by pattern (regex supported)'
        )
        parser.add_argument(
            '--include-admin',
            action='store_true',
            help='Include Django admin URLs'
        )

    def handle(self, *args, **options):
        """Handle the command execution."""
        self.stdout.write(
            self.style.SUCCESS('Available URLs in Study Bud API:')
        )
        self.stdout.write('-' * 80)

        resolver = get_resolver()
        urls = self._extract_urls(resolver)

        # Apply filters
        if options['filter']:
            pattern = re.compile(options['filter'], re.IGNORECASE)
            urls = [url for url in urls if pattern.search(
                url['pattern']) or pattern.search(url['name'] or '')]

        if not options['include_admin']:
            urls = [
                url for url in urls if not url['pattern'].startswith('admin/')]

        # Sort URLs by pattern
        urls.sort(key=lambda x: x['pattern'])

        # Display URLs based on format
        if options['format'] == 'table':
            self._display_table(urls)
        elif options['format'] == 'list':
            self._display_list(urls)
        elif options['format'] == 'json':
            self._display_json(urls)

        self.stdout.write(
            self.style.SUCCESS(f'\nTotal URLs found: {len(urls)}')
        )

    def _extract_urls(self, resolver, path=''):
        """Recursively extract URLs from URL resolver."""
        urls = []

        for pattern in resolver.url_patterns:
            if hasattr(pattern, 'url_patterns'):
                # This is a URL include, recurse into it
                urls.extend(self._extract_urls(
                    pattern,
                    path + str(pattern.pattern).replace('^',
                                                        '').replace('$', '')
                ))
            else:
                # This is a URL pattern
                full_path = path + \
                    str(pattern.pattern).replace('^', '').replace('$', '')

                # Clean up the path
                full_path = full_path.replace('\\', '').replace(
                    '(?P<', '{').replace('>[^/.]+)', '}')
                full_path = re.sub(
                    r'\{\w+\}', lambda m: f'{{{m.group(0)[1:-1]}}}', full_path)

                # Get view name
                view_name = None
                if hasattr(pattern, 'name') and pattern.name:
                    view_name = pattern.name
                elif hasattr(pattern.callback, '__name__'):
                    view_name = pattern.callback.__name__
                elif hasattr(pattern.callback, 'view_class'):
                    view_name = pattern.callback.view_class.__name__

                # Get HTTP methods
                methods = ['GET']  # Default
                if hasattr(pattern.callback, 'view_class'):
                    view_class = pattern.callback.view_class
                    if hasattr(view_class, 'http_method_names'):
                        methods = [m.upper() for m in view_class.http_method_names
                                   if m != 'options' and hasattr(view_class, m)]

                urls.append({
                    'pattern': full_path,
                    'name': view_name,
                    'methods': methods
                })

        return urls

    def _display_table(self, urls):
        """Display URLs in table format."""
        # Header
        self.stdout.write(
            f"{'Pattern':<50} {'Methods':<15} {'Name':<30}"
        )
        self.stdout.write('-' * 95)

        # URLs
        for url in urls:
            methods_str = ', '.join(
                url['methods']) if url['methods'] else 'GET'
            name_str = url['name'] or 'N/A'

            self.stdout.write(
                f"{url['pattern']:<50} {methods_str:<15} {name_str:<30}"
            )

    def _display_list(self, urls):
        """Display URLs in list format."""
        for url in urls:
            methods_str = ', '.join(
                url['methods']) if url['methods'] else 'GET'
            self.stdout.write(f"• {url['pattern']}")
            if url['name']:
                self.stdout.write(f"  └─ Name: {url['name']}")
            self.stdout.write(f"  └─ Methods: {methods_str}")
            self.stdout.write('')

    def _display_json(self, urls):
        """Display URLs in JSON format."""
        import json
        self.stdout.write(json.dumps(urls, indent=2))
