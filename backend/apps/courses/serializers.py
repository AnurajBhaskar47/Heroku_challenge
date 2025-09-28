"""
Serializers for the courses app.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Course, Assignment, CourseQuiz, CourseAssignmentFile, CourseTopic, CourseTopicItem, Exam


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Assignment model.
    """

    # Read-only computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_due = serializers.IntegerField(read_only=True)
    time_until_due = serializers.CharField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'assignment_type', 'description',
            'due_date', 'estimated_hours', 'weight', 'grade',
            'status', 'is_overdue', 'days_until_due', 'time_until_due',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_due_date(self, value):
        """Validate that due date is in the future for new assignments."""
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError(
                "Due date cannot be in the past for new assignments."
            )
        return value

    def validate_grade(self, value):
        """Validate grade is between 0 and 100."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Grade must be between 0 and 100."
            )
        return value

    def validate_weight(self, value):
        """Validate weight is between 0 and 100."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Weight must be between 0 and 100 percent."
            )
        return value


class AssignmentCreateSerializer(AssignmentSerializer):
    """
    Serializer for creating assignments with course reference.
    """
    course_id = serializers.IntegerField(write_only=True)

    class Meta(AssignmentSerializer.Meta):
        fields = AssignmentSerializer.Meta.fields + ['course_id']

    def validate_course_id(self, value):
        """Validate that the course exists and belongs to the user."""
        try:
            course = Course.objects.get(id=value)
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course does not exist.")

        # Check if the course belongs to the current user
        user = self.context['request'].user
        if course.user != user:
            raise serializers.ValidationError(
                "You can only create assignments for your own courses."
            )
        return value

    def create(self, validated_data):
        """Create assignment with course."""
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        assignment = Assignment.objects.create(course=course, **validated_data)
        return assignment


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for Course model.
    """

    # Read-only computed fields
    assignment_count = serializers.IntegerField(read_only=True)
    completed_assignment_count = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'instructor',
            'credits', 'semester', 'start_date', 'end_date',
            'class_schedule', 'syllabus_text', 'difficulty_level',
            'is_active', 'assignment_count', 'completed_assignment_count',
            'progress_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_credits(self, value):
        """Validate credits is between 1 and 10."""
        if value < 1 or value > 10:
            raise serializers.ValidationError(
                "Credits must be between 1 and 10."
            )
        return value

    def validate_difficulty_level(self, value):
        """Validate difficulty level is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Difficulty level must be between 1 and 5."
            )
        return value

    def validate(self, attrs):
        """Validate that start_date is before end_date."""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(
                "Start date must be before end date."
            )

        return attrs


class CourseDetailSerializer(CourseSerializer):
    """
    Detailed serializer for Course model with nested assignments.
    """
    assignments = AssignmentSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['assignments']


class CourseStatsSerializer(serializers.Serializer):
    """
    Serializer for course statistics.
    """
    total_courses = serializers.IntegerField()
    active_courses = serializers.IntegerField()
    total_assignments = serializers.IntegerField()
    completed_assignments = serializers.IntegerField()
    overdue_assignments = serializers.IntegerField()
    upcoming_assignments = serializers.IntegerField()
    average_progress = serializers.FloatField()


class AssignmentStatsSerializer(serializers.Serializer):
    """
    Serializer for assignment statistics by type.
    """
    assignment_type = serializers.CharField()
    count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    average_grade = serializers.FloatField()


class CourseQuizSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseQuiz model.
    """
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()

    class Meta:
        model = CourseQuiz
        fields = [
            'id', 'title', 'description', 'file', 'file_url', 'file_type',
            'file_size', 'file_size_mb', 'is_processed', 'processing_error',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['file_type', 'file_size', 'is_processed', 'processing_error', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        """Get the full URL for the file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_mb(self, obj):
        """Convert file size to MB for display."""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None


class CourseAssignmentFileSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseAssignmentFile model.
    """
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    assignment = AssignmentSerializer(read_only=True)
    assignment_extracted = serializers.SerializerMethodField()

    class Meta:
        model = CourseAssignmentFile
        fields = [
            'id', 'title', 'description', 'file', 'file_url', 'file_type',
            'file_size', 'file_size_mb', 'is_processed', 'processing_error',
            'assignment', 'assignment_extracted', 'created_at', 'updated_at'
        ]
        read_only_fields = ['file_type', 'file_size', 'is_processed', 'processing_error', 'assignment', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        """Get the full URL for the file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_mb(self, obj):
        """Convert file size to MB for display."""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None

    def get_assignment_extracted(self, obj):
        """Check if assignment was successfully extracted."""
        return obj.assignment is not None


class CourseTopicItemSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseTopicItem model.
    """
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    
    class Meta:
        model = CourseTopicItem
        fields = [
            'id', 'title', 'description', 'difficulty', 'difficulty_display',
            'order', 'is_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_title(self, value):
        """Validate that title is not empty."""
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()


class CourseTopicSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseTopic model.
    """
    syllabus_file_url = serializers.SerializerMethodField()
    has_content = serializers.BooleanField(read_only=True)
    content_source = serializers.CharField(read_only=True)
    topic_count = serializers.SerializerMethodField()
    topic_items = CourseTopicItemSerializer(many=True, read_only=True)

    class Meta:
        model = CourseTopic
        fields = [
            'id', 'syllabus_text', 'syllabus_file', 'syllabus_file_url',
            'extracted_topics', 'topics_summary', 'is_processed',
            'processing_error', 'has_content', 'content_source',
            'topic_count', 'topic_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['extracted_topics', 'topics_summary', 'is_processed', 'processing_error', 'topic_items', 'created_at', 'updated_at']

    def get_syllabus_file_url(self, obj):
        """Get the full URL for the syllabus file."""
        if obj.syllabus_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.syllabus_file.url)
            return obj.syllabus_file.url
        return None

    def get_topic_count(self, obj):
        """Get the number of extracted topics."""
        return obj.topic_items.count()

    def validate(self, attrs):
        """Validate that either syllabus_text or syllabus_file is provided."""
        syllabus_text = attrs.get('syllabus_text', '').strip()
        syllabus_file = attrs.get('syllabus_file')
        
        if not syllabus_text and not syllabus_file:
            raise serializers.ValidationError(
                "Either syllabus text or syllabus file must be provided."
            )
        return attrs


class CourseDetailWithFilesSerializer(CourseDetailSerializer):
    """
    Extended course detail serializer that includes quiz files, assignment files, and topics.
    """
    quiz_files = CourseQuizSerializer(many=True, read_only=True)
    assignment_files = CourseAssignmentFileSerializer(many=True, read_only=True)
    course_topics = CourseTopicSerializer(many=True, read_only=True)

    class Meta(CourseDetailSerializer.Meta):
        fields = CourseDetailSerializer.Meta.fields + [
            'quiz_files', 'assignment_files', 'course_topics'
        ]


class ExamSerializer(serializers.ModelSerializer):
    """
    Serializer for Exam model.
    """
    
    # Read-only computed fields
    is_upcoming = serializers.BooleanField(read_only=True)
    days_until_exam = serializers.IntegerField(read_only=True)
    time_until_exam = serializers.CharField(read_only=True)
    preparation_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'exam_type', 'exam_type_display', 'description',
            'exam_date', 'duration_minutes', 'location', 'syllabus_coverage',
            'total_weightage', 'status', 'status_display', 'grade',
            'preparation_status', 'study_plan_generated', 'is_upcoming',
            'days_until_exam', 'time_until_exam', 'preparation_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_exam_date(self, value):
        """Validate that exam date is not in the past for new exams."""
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError("Exam date cannot be in the past.")
        return value
    
    def validate_syllabus_coverage(self, value):
        """Validate syllabus coverage format."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Syllabus coverage must be a list.")
        
        total_weightage = 0
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each syllabus item must be an object.")
            
            if 'topic' not in item or 'weightage' not in item:
                raise serializers.ValidationError("Each syllabus item must have 'topic' and 'weightage' fields.")
            
            try:
                weightage = float(item['weightage'])
                if weightage < 0 or weightage > 100:
                    raise serializers.ValidationError("Weightage must be between 0 and 100.")
                total_weightage += weightage
            except (ValueError, TypeError):
                raise serializers.ValidationError("Weightage must be a valid number.")
        
        if total_weightage > 100:
            raise serializers.ValidationError("Total weightage cannot exceed 100%.")
        
        return value


class ExamCreateSerializer(ExamSerializer):
    """
    Serializer for creating new exams with additional validation.
    """
    
    def validate(self, attrs):
        """Additional validation for exam creation."""
        attrs = super().validate(attrs)
        
        # Ensure exam name is unique for the course
        course = self.context.get('course')
        if course:
            exam_name = attrs.get('name')
            exam_date = attrs.get('exam_date')
            
            existing_exam = course.exams.filter(
                name__iexact=exam_name,
                exam_date__date=exam_date.date()
            ).first()
            
            if existing_exam and existing_exam != self.instance:
                raise serializers.ValidationError({
                    'name': 'An exam with this name already exists on the same date.'
                })
        
        return attrs
