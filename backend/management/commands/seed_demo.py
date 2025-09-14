"""
Management command to seed the database with demo data.

This creates sample users, courses, assignments, study plans, and resources
for development and testing purposes.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
import json

from apps.courses.models import Course, Assignment
from apps.study_plans.models import StudyPlan
from apps.resources.models import Resource, ResourceCollection

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with demo data for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=3,
            help='Number of demo users to create'
        )

        parser.add_argument(
            '--courses',
            type=int,
            default=5,
            help='Number of demo courses per user'
        )

        parser.add_argument(
            '--assignments',
            type=int,
            default=8,
            help='Number of demo assignments per course'
        )

        parser.add_argument(
            '--resources',
            type=int,
            default=20,
            help='Number of demo resources to create'
        )

        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding'
        )

    def handle(self, *args, **options):
        """Execute the command."""
        num_users = options['users']
        num_courses = options['courses']
        num_assignments = options['assignments']
        num_resources = options['resources']
        clear_existing = options['clear']

        if clear_existing:
            self.stdout.write(
                self.style.WARNING('Clearing existing data...')
            )
            self.clear_data()

        self.stdout.write(
            self.style.SUCCESS(
                f'Starting demo data creation: '
                f'{num_users} users, {num_courses} courses per user, '
                f'{num_assignments} assignments per course, {num_resources} resources'
            )
        )

        try:
            with transaction.atomic():
                # Create demo users
                users = self.create_demo_users(num_users)

                # Create demo courses and assignments
                courses = self.create_demo_courses(
                    users, num_courses, num_assignments)

                # Create demo study plans
                study_plans = self.create_demo_study_plans(courses)

                # Create demo resources
                resources = self.create_demo_resources(num_resources, users)

                # Create demo resource collections
                collections = self.create_demo_collections(users, resources)

            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDemo data created successfully!\n'
                    f'Users: {len(users)}\n'
                    f'Courses: {len(courses)}\n'
                    f'Study Plans: {len(study_plans)}\n'
                    f'Resources: {len(resources)}\n'
                    f'Collections: {len(collections)}'
                )
            )

            # Display login information
            self.display_login_info(users)

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating demo data: {e}')
            )
            raise

    def clear_data(self):
        """Clear existing data."""
        # Clear in reverse dependency order
        ResourceCollection.objects.all().delete()
        Resource.objects.all().delete()
        StudyPlan.objects.all().delete()
        Assignment.objects.all().delete()
        Course.objects.all().delete()

        # Don't delete superusers
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write('Existing data cleared.')

    def create_demo_users(self, num_users):
        """Create demo users."""
        self.stdout.write('\nCreating demo users...')

        users = []
        demo_users_data = [
            {
                'username': 'alice_student',
                'email': 'alice@example.com',
                'first_name': 'Alice',
                'last_name': 'Johnson',
                'year_of_study': 3,
                'major': 'Computer Science',
                'study_preferences': {
                    'preferred_study_time': 'morning',
                    'study_style': 'visual',
                    'break_frequency': 25
                }
            },
            {
                'username': 'bob_learner',
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Smith',
                'year_of_study': 2,
                'major': 'Mathematics',
                'study_preferences': {
                    'preferred_study_time': 'evening',
                    'study_style': 'auditory',
                    'break_frequency': 30
                }
            },
            {
                'username': 'charlie_dev',
                'email': 'charlie@example.com',
                'first_name': 'Charlie',
                'last_name': 'Brown',
                'year_of_study': 4,
                'major': 'Software Engineering',
                'study_preferences': {
                    'preferred_study_time': 'afternoon',
                    'study_style': 'kinesthetic',
                    'break_frequency': 20
                }
            }
        ]

        for i in range(num_users):
            user_data = demo_users_data[i % len(demo_users_data)].copy()
            if i >= len(demo_users_data):
                user_data['username'] = f"demo_user_{i+1}"
                user_data['email'] = f"user{i+1}@example.com"
                user_data['first_name'] = f"User{i+1}"
                user_data['last_name'] = "Demo"

            user = User.objects.create_user(
                password='demo123!',  # Simple password for demo
                **user_data
            )
            users.append(user)

            self.stdout.write(f'  ✓ Created user: {user.username}')

        return users

    def create_demo_courses(self, users, num_courses, num_assignments):
        """Create demo courses and assignments."""
        self.stdout.write(f'\nCreating demo courses and assignments...')

        courses = []

        course_templates = [
            {
                'name': 'Introduction to Python Programming',
                'code': 'CS101',
                'description': 'Learn the fundamentals of Python programming including variables, functions, loops, and data structures.',
                'instructor': 'Dr. Sarah Wilson',
                'credits': 3,
                'difficulty_level': 2,
                'semester': 'Fall 2024',
                'syllabus_text': 'This course covers Python basics, object-oriented programming, and practical applications.'
            },
            {
                'name': 'Data Structures and Algorithms',
                'code': 'CS201',
                'description': 'Study fundamental data structures and algorithms with emphasis on efficiency and problem-solving.',
                'instructor': 'Prof. Michael Chen',
                'credits': 4,
                'difficulty_level': 4,
                'semester': 'Fall 2024',
                'syllabus_text': 'Topics include arrays, linked lists, trees, graphs, sorting, and searching algorithms.'
            },
            {
                'name': 'Calculus I',
                'code': 'MATH101',
                'description': 'Introduction to differential calculus including limits, derivatives, and applications.',
                'instructor': 'Dr. Emily Rodriguez',
                'credits': 4,
                'difficulty_level': 3,
                'semester': 'Fall 2024',
                'syllabus_text': 'Covers limits, continuity, derivatives, optimization, and related rates.'
            },
            {
                'name': 'Database Systems',
                'code': 'CS301',
                'description': 'Design and implementation of database systems, SQL, and database theory.',
                'instructor': 'Prof. David Kim',
                'credits': 3,
                'difficulty_level': 3,
                'semester': 'Fall 2024',
                'syllabus_text': 'Database design, normalization, SQL, transactions, and NoSQL databases.'
            },
            {
                'name': 'Linear Algebra',
                'code': 'MATH201',
                'description': 'Vector spaces, linear transformations, matrices, and eigenvalues.',
                'instructor': 'Dr. Lisa Wang',
                'credits': 3,
                'difficulty_level': 3,
                'semester': 'Fall 2024',
                'syllabus_text': 'Linear systems, vector spaces, matrix operations, and applications.'
            }
        ]

        assignment_templates = [
            {'title': 'Variables and Data Types',
                'type': 'homework', 'hours': 2.0, 'weight': 5.0},
            {'title': 'Control Structures Quiz',
                'type': 'quiz', 'hours': 1.0, 'weight': 10.0},
            {'title': 'Function Implementation',
                'type': 'project', 'hours': 4.0, 'weight': 15.0},
            {'title': 'Midterm Exam', 'type': 'exam', 'hours': 2.0, 'weight': 25.0},
            {'title': 'Object-Oriented Design',
                'type': 'project', 'hours': 6.0, 'weight': 20.0},
            {'title': 'Final Project', 'type': 'project',
                'hours': 10.0, 'weight': 25.0},
            {'title': 'Code Review Exercise',
                'type': 'lab', 'hours': 2.0, 'weight': 5.0},
            {'title': 'Algorithm Analysis', 'type': 'homework',
                'hours': 3.0, 'weight': 10.0}
        ]

        for user in users:
            for i in range(num_courses):
                course_template = course_templates[i % len(
                    course_templates)].copy()

                # Add some variety to course names for different users
                if i >= len(course_templates):
                    course_template['name'] = f"Course {i+1} - {course_template['name']}"
                    course_template['code'] = f"{course_template['code']}-{i+1}"

                # Set dates
                start_date = timezone.now().date() - timedelta(days=30)
                end_date = start_date + timedelta(days=120)

                course = Course.objects.create(
                    user=user,
                    start_date=start_date,
                    end_date=end_date,
                    **course_template
                )
                courses.append(course)

                # Create assignments for this course
                for j in range(num_assignments):
                    assignment_template = assignment_templates[j % len(
                        assignment_templates)].copy()

                    # Calculate due date (spread assignments across the semester)
                    days_offset = (j + 1) * (120 // num_assignments)
                    due_date = timezone.now() + timedelta(days=days_offset - 15)

                    Assignment.objects.create(
                        course=course,
                        title=assignment_template['title'],
                        assignment_type=assignment_template['type'],
                        estimated_hours=assignment_template['hours'],
                        weight=assignment_template['weight'],
                        due_date=due_date,
                        status='not_started' if due_date > timezone.now() else 'completed'
                    )

                self.stdout.write(
                    f'  ✓ Created course: {course.name} for {user.username}')

        return courses

    def create_demo_study_plans(self, courses):
        """Create demo study plans."""
        self.stdout.write(f'\nCreating demo study plans...')

        study_plans = []

        # Create study plans for some courses (not all)
        for course in courses[::2]:  # Every other course
            plan_data = {
                'topics': [
                    {
                        'id': 'topic_1',
                        'title': f'Introduction to {course.name.split()[-1]}',
                        'description': 'Basic concepts and terminology',
                        'estimated_hours': 3.0,
                        'difficulty_level': 2,
                        'resources': ['textbook_ch1', 'online_tutorial'],
                        'completed': True
                    },
                    {
                        'id': 'topic_2',
                        'title': 'Advanced Concepts',
                        'description': 'Deep dive into complex topics',
                        'estimated_hours': 5.0,
                        'difficulty_level': 4,
                        'resources': ['textbook_ch5', 'practice_problems'],
                        'completed': False
                    },
                    {
                        'id': 'topic_3',
                        'title': 'Practical Applications',
                        'description': 'Real-world usage and examples',
                        'estimated_hours': 4.0,
                        'difficulty_level': 3,
                        'resources': ['case_studies', 'project_examples'],
                        'completed': False
                    }
                ],
                'milestones': [
                    {
                        'id': 'milestone_1',
                        'title': 'Complete Basic Topics',
                        'description': 'Finish introduction and fundamental concepts',
                        'due_date': (timezone.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
                        'completed': True,
                        'progress_weight': 0.3
                    },
                    {
                        'id': 'milestone_2',
                        'title': 'Midterm Preparation',
                        'description': 'Review and practice for midterm exam',
                        'due_date': (timezone.now() + timedelta(days=35)).strftime('%Y-%m-%d'),
                        'completed': False,
                        'progress_weight': 0.4
                    },
                    {
                        'id': 'milestone_3',
                        'title': 'Final Project',
                        'description': 'Complete and submit final project',
                        'due_date': (timezone.now() + timedelta(days=70)).strftime('%Y-%m-%d'),
                        'completed': False,
                        'progress_weight': 0.3
                    }
                ],
                'estimated_hours': 25,
                'difficulty_level': course.difficulty_level
            }

            study_plan = StudyPlan.objects.create(
                user=course.user,
                course=course,
                title=f'Study Plan for {course.name}',
                description=f'Comprehensive study plan to master {course.name}',
                start_date=course.start_date or timezone.now().date(),
                end_date=course.end_date or (
                    timezone.now().date() + timedelta(days=90)),
                status='active',
                progress_percentage=30.0,  # Some progress made
                plan_data=plan_data
            )
            study_plans.append(study_plan)

            self.stdout.write(f'  ✓ Created study plan for: {course.name}')

        return study_plans

    def create_demo_resources(self, num_resources, users):
        """Create demo resources."""
        self.stdout.write(f'\nCreating demo resources...')

        resources = []

        resource_templates = [
            {
                'title': 'Python Official Documentation',
                'description': 'Comprehensive documentation for Python programming language',
                'url': 'https://docs.python.org/3/',
                'resource_type': 'documentation',
                'subject': 'Computer Science',
                'topics': ['Python', 'Programming', 'Documentation'],
                'difficulty_level': 3,
                'estimated_time': 2.0,
                'rating': 4.8,
                'is_verified': True
            },
            {
                'title': 'Khan Academy - Calculus',
                'description': 'Free online calculus course with interactive exercises',
                'url': 'https://www.khanacademy.org/math/calculus-1',
                'resource_type': 'course',
                'subject': 'Mathematics',
                'topics': ['Calculus', 'Derivatives', 'Limits'],
                'difficulty_level': 2,
                'estimated_time': 15.0,
                'rating': 4.6,
                'is_verified': True
            },
            {
                'title': 'CS50 - Introduction to Computer Science',
                'description': 'Harvard\'s introduction to computer science and programming',
                'url': 'https://cs50.harvard.edu/x/',
                'resource_type': 'course',
                'subject': 'Computer Science',
                'topics': ['Programming', 'Algorithms', 'Data Structures'],
                'difficulty_level': 3,
                'estimated_time': 60.0,
                'rating': 4.9,
                'is_verified': True
            },
            {
                'title': 'LeetCode Practice Problems',
                'description': 'Platform for practicing coding problems and algorithms',
                'url': 'https://leetcode.com/',
                'resource_type': 'quiz',
                'subject': 'Computer Science',
                'topics': ['Algorithms', 'Data Structures', 'Programming'],
                'difficulty_level': 4,
                'estimated_time': 1.0,
                'rating': 4.3,
                'is_verified': True
            },
            {
                'title': 'MIT OpenCourseWare - Linear Algebra',
                'description': 'Free MIT course materials for linear algebra',
                'url': 'https://ocw.mit.edu/courses/mathematics/18-06-linear-algebra-spring-2010/',
                'resource_type': 'course',
                'subject': 'Mathematics',
                'topics': ['Linear Algebra', 'Matrices', 'Vector Spaces'],
                'difficulty_level': 4,
                'estimated_time': 40.0,
                'rating': 4.7,
                'is_verified': True
            }
        ]

        for i in range(num_resources):
            template = resource_templates[i % len(resource_templates)].copy()

            # Add variety to resources
            if i >= len(resource_templates):
                template['title'] = f"{template['title']} - Resource {i+1}"

            # Randomly assign some resources to users
            added_by_user = users[i % len(users)] if i % 3 == 0 else None

            resource = Resource.objects.create(
                added_by_user=added_by_user,
                view_count=i * 5 + 10,  # Simulate view counts
                **template
            )
            resources.append(resource)

            self.stdout.write(f'  ✓ Created resource: {resource.title}')

        return resources

    def create_demo_collections(self, users, resources):
        """Create demo resource collections."""
        self.stdout.write(f'\nCreating demo resource collections...')

        collections = []

        collection_templates = [
            {
                'name': 'Programming Fundamentals',
                'description': 'Essential resources for learning programming basics',
                'is_public': True
            },
            {
                'name': 'Math Study Materials',
                'description': 'Comprehensive mathematics learning resources',
                'is_public': True
            },
            {
                'name': 'My Bookmarks',
                'description': 'Personal collection of useful study resources',
                'is_public': False
            }
        ]

        for user in users:
            for template in collection_templates:
                collection = ResourceCollection.objects.create(
                    user=user,
                    **template
                )

                # Add some resources to the collection
                relevant_resources = [
                    r for r in resources if user.major.lower() in r.subject.lower()][:3]
                if not relevant_resources:
                    relevant_resources = resources[:3]

                collection.resources.set(relevant_resources)
                collections.append(collection)

                self.stdout.write(
                    f'  ✓ Created collection: {collection.name} for {user.username}')

        return collections

    def display_login_info(self, users):
        """Display login information for demo users."""
        self.stdout.write(
            self.style.SUCCESS('\n' + '='*50)
        )
        self.stdout.write(
            self.style.SUCCESS('DEMO USER LOGIN INFORMATION')
        )
        self.stdout.write(
            self.style.SUCCESS('='*50)
        )

        for user in users:
            self.stdout.write(
                f'Username: {user.username}\n'
                f'Email: {user.email}\n'
                f'Password: demo123!\n'
                f'Name: {user.get_full_name()}\n'
                f'Major: {user.major}\n'
                f'Year: {user.year_of_study}\n'
                f'{"-"*30}'
            )

        self.stdout.write(
            self.style.SUCCESS(
                '\nYou can now log in with any of these accounts to explore the demo data!'
            )
        )
