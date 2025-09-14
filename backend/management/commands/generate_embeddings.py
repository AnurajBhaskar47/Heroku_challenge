"""
Management command to generate embeddings for resources and study plans.

This command will populate embedding fields for vector search functionality
when pgvector is enabled.
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import time

from apps.resources.models import Resource
from apps.study_plans.models import StudyPlan
from utils.enhanced_ai_client import EnhancedAIClient


class Command(BaseCommand):
    help = 'Generate embeddings for resources and study plans for vector search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--model',
            type=str,
            choices=['resources', 'study_plans', 'all'],
            default='all',
            help='Which models to generate embeddings for'
        )

        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Number of items to process in each batch'
        )

        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regeneration of existing embeddings'
        )

        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        """Execute the command."""
        # Check if vector search is enabled
        if not getattr(settings, 'USE_VECTOR_SEARCH', False):
            self.stdout.write(
                self.style.WARNING(
                    'Vector search is disabled. Set USE_VECTOR_SEARCH=True to enable embeddings.'
                )
            )
            return

        # Initialize AI client
        try:
            ai_client = EnhancedAIClient()
            if not ai_client.vector_search_enabled:
                raise Exception("Vector search not enabled in AI client")
        except Exception as e:
            raise CommandError(f'Failed to initialize AI client: {e}')

        model_type = options['model']
        batch_size = options['batch_size']
        force = options['force']
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.SUCCESS(
                f'Starting embedding generation for {model_type} '
                f'(batch_size={batch_size}, force={force}, dry_run={dry_run})'
            )
        )

        total_processed = 0
        total_updated = 0
        start_time = time.time()

        try:
            if model_type in ['resources', 'all']:
                processed, updated = self.generate_resource_embeddings(
                    ai_client, batch_size, force, dry_run
                )
                total_processed += processed
                total_updated += updated

            if model_type in ['study_plans', 'all']:
                processed, updated = self.generate_study_plan_embeddings(
                    ai_client, batch_size, force, dry_run
                )
                total_processed += processed
                total_updated += updated

            duration = time.time() - start_time

            self.stdout.write(
                self.style.SUCCESS(
                    f'\nCompleted! Processed {total_processed} items, '
                    f'updated {total_updated} embeddings in {duration:.2f} seconds'
                )
            )

        except KeyboardInterrupt:
            self.stdout.write(
                self.style.WARNING('\nOperation interrupted by user')
            )
        except Exception as e:
            raise CommandError(f'Error during embedding generation: {e}')

    def generate_resource_embeddings(self, ai_client, batch_size, force, dry_run):
        """Generate embeddings for resources."""
        self.stdout.write(
            self.style.HTTP_INFO('\n=== Generating Resource Embeddings ===')
        )

        # Get resources that need embeddings
        if force:
            resources = Resource.objects.all()
        else:
            resources = Resource.objects.filter(embedding__isnull=True)

        total_count = resources.count()

        if total_count == 0:
            self.stdout.write('No resources need embeddings.')
            return 0, 0

        self.stdout.write(f'Found {total_count} resources to process')

        processed = 0
        updated = 0

        # Process in batches
        for i in range(0, total_count, batch_size):
            batch = resources[i:i+batch_size]
            batch_texts = []
            batch_items = []

            for resource in batch:
                # Combine title, description, and topics for embedding
                text_parts = [resource.title]

                if resource.description:
                    text_parts.append(resource.description)

                if resource.subject:
                    text_parts.append(resource.subject)

                if resource.topics:
                    if isinstance(resource.topics, list):
                        text_parts.extend(resource.topics)
                    elif isinstance(resource.topics, str):
                        text_parts.append(resource.topics)

                combined_text = ' '.join(text_parts)
                batch_texts.append(combined_text)
                batch_items.append(resource)

            if dry_run:
                self.stdout.write(
                    f'  [DRY RUN] Would generate embeddings for batch {i//batch_size + 1} '
                    f'({len(batch_items)} items)'
                )
                processed += len(batch_items)
                continue

            try:
                # Generate embeddings for the batch
                self.stdout.write(
                    f'  Generating embeddings for batch {i//batch_size + 1} '
                    f'({len(batch_items)} items)...'
                )

                embeddings = ai_client.generate_embeddings(batch_texts)

                # Update resources with embeddings
                with transaction.atomic():
                    for resource, embedding in zip(batch_items, embeddings):
                        if embedding:  # Only update if embedding was generated
                            resource.embedding = embedding
                            resource.save(update_fields=['embedding'])
                            updated += 1
                        processed += 1

                self.stdout.write(
                    f'    ✓ Updated {len(embeddings)} embeddings')

                # Small delay to avoid overwhelming the API
                time.sleep(0.1)

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'    ✗ Failed to process batch {i//batch_size + 1}: {e}'
                    )
                )
                # Count as processed even if failed
                processed += len(batch_items)

        return processed, updated

    def generate_study_plan_embeddings(self, ai_client, batch_size, force, dry_run):
        """Generate embeddings for study plans."""
        self.stdout.write(
            self.style.HTTP_INFO('\n=== Generating Study Plan Embeddings ===')
        )

        # Get study plans that need embeddings
        if force:
            study_plans = StudyPlan.objects.select_related('course')
        else:
            study_plans = StudyPlan.objects.filter(
                plan_embedding__isnull=True
            ).select_related('course')

        total_count = study_plans.count()

        if total_count == 0:
            self.stdout.write('No study plans need embeddings.')
            return 0, 0

        self.stdout.write(f'Found {total_count} study plans to process')

        processed = 0
        updated = 0

        # Process in batches
        for i in range(0, total_count, batch_size):
            batch = study_plans[i:i+batch_size]
            batch_texts = []
            batch_items = []

            for plan in batch:
                # Combine title, description, course info, and plan data for embedding
                text_parts = [plan.title]

                if plan.description:
                    text_parts.append(plan.description)

                if plan.course:
                    text_parts.append(plan.course.name)
                    if plan.course.description:
                        text_parts.append(plan.course.description)

                # Extract meaningful text from plan_data
                if plan.plan_data:
                    if isinstance(plan.plan_data, dict):
                        # Extract topics
                        if 'topics' in plan.plan_data:
                            topics = plan.plan_data['topics']
                            if isinstance(topics, list):
                                for topic in topics:
                                    if isinstance(topic, dict) and 'title' in topic:
                                        text_parts.append(topic['title'])
                                    elif isinstance(topic, str):
                                        text_parts.append(topic)

                        # Extract milestone titles
                        if 'milestones' in plan.plan_data:
                            milestones = plan.plan_data['milestones']
                            if isinstance(milestones, list):
                                for milestone in milestones:
                                    if isinstance(milestone, dict) and 'title' in milestone:
                                        text_parts.append(milestone['title'])

                combined_text = ' '.join(text_parts)
                batch_texts.append(combined_text)
                batch_items.append(plan)

            if dry_run:
                self.stdout.write(
                    f'  [DRY RUN] Would generate embeddings for batch {i//batch_size + 1} '
                    f'({len(batch_items)} items)'
                )
                processed += len(batch_items)
                continue

            try:
                # Generate embeddings for the batch
                self.stdout.write(
                    f'  Generating embeddings for batch {i//batch_size + 1} '
                    f'({len(batch_items)} items)...'
                )

                embeddings = ai_client.generate_embeddings(batch_texts)

                # Update study plans with embeddings
                with transaction.atomic():
                    for plan, embedding in zip(batch_items, embeddings):
                        if embedding:  # Only update if embedding was generated
                            plan.plan_embedding = embedding
                            plan.save(update_fields=['plan_embedding'])
                            updated += 1
                        processed += 1

                self.stdout.write(
                    f'    ✓ Updated {len(embeddings)} embeddings')

                # Small delay to avoid overwhelming the API
                time.sleep(0.1)

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'    ✗ Failed to process batch {i//batch_size + 1}: {e}'
                    )
                )
                # Count as processed even if failed
                processed += len(batch_items)

        return processed, updated
