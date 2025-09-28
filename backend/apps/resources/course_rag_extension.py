"""
Extension to RAG pipeline for processing course-specific content.
This includes methods for processing quiz files, assignment files, and course topics.
"""

import logging
import os
from django.utils import timezone

logger = logging.getLogger(__name__)


class CourseRAGExtension:
    """
    Extension class for processing course-specific content through RAG pipeline.
    """
    
    @staticmethod
    def _get_file_type_from_path(file_path: str) -> str:
        """Extract file type from file path."""
        try:
            _, ext = os.path.splitext(file_path)
            file_type = ext.lstrip('.').lower()
            # Map common extensions
            if file_type in ['pdf']:
                return 'pdf'
            elif file_type in ['doc', 'docx']:
                return 'docx'
            elif file_type in ['txt']:
                return 'txt'
            else:
                return file_type or 'txt'  # Default to txt
        except Exception:
            return 'txt'  # Fallback to txt
    
    @staticmethod
    def process_course_quiz(quiz):
        """
        Process a course quiz file through the RAG pipeline.
        
        Args:
            quiz: CourseQuiz instance with file to process
        """
        from .rag_models import Document, DocumentChunk, KnowledgeNode
        from .rag_pipeline import DocumentProcessor, EmbeddingGenerator, get_openai_client
        
        try:
            # Extract text from the quiz file
            file_type = CourseRAGExtension._get_file_type_from_path(quiz.file.path)
            content = DocumentProcessor.extract_text_from_file(quiz.file.path, file_type)
            if not content or len(content.strip()) < 100:
                quiz.processing_error = "Insufficient content extracted from file"
                quiz.save()
                return
            
            # Create a Document entry for the quiz
            document = Document.objects.create(
                title=f"Quiz: {quiz.title}",
                content=content[:10000],  # Store first 10k chars
                document_type='course_quiz',
                source_url=quiz.file.url if quiz.file else '',
                metadata={
                    'course_id': quiz.course.id,
                    'course_name': quiz.course.name,
                    'quiz_id': quiz.id,
                    'file_type': quiz.file_type,
                    'original_filename': quiz.file.name.split('/')[-1] if quiz.file else ''
                }
            )
            
            # Chunk the content
            chunks = DocumentProcessor.intelligent_chunk_text(content, chunk_size=1500)
            
            # Process each chunk
            for i, chunk_data in enumerate(chunks):
                chunk_text = chunk_data['content']
                if len(chunk_text.strip()) < 50:
                    continue
                    
                # Generate embedding for the chunk
                try:
                    embedding = EmbeddingGenerator.generate_embedding(chunk_text)
                    if not embedding:
                        continue
                    
                    # Create document chunk with embedding
                    chunk = DocumentChunk.objects.create(
                        document=document,
                        chunk_index=chunk_data['chunk_index'],
                        content=chunk_text,
                        chunk_type=chunk_data.get('chunk_type', 'quiz_info'),
                        word_count=chunk_data.get('word_count', len(chunk_text.split())),
                        difficulty_level=chunk_data.get('difficulty_level', 3),
                        topics=chunk_data.get('topics', []),
                        learning_objectives=chunk_data.get('learning_objectives', []),
                        estimated_study_time=chunk_data.get('estimated_study_time', 10),
                        embedding=embedding,
                        course=quiz.course
                    )
                    
                    # Create knowledge nodes for the topics
                    topics = chunk_data.get('topics', [])
                    for topic in topics:
                        if len(topic.strip()) >= 3:
                            knowledge_node, created = KnowledgeNode.objects.get_or_create(
                                topic=topic.strip(),
                                defaults={
                                    'description': f'Quiz content about {topic}',
                                    'confidence_score': 0.8,
                                    'metadata': {'source_type': 'quiz', 'course_id': quiz.course.id}
                                }
                            )
                            knowledge_node.related_chunks.add(chunk)
                    
                except Exception as e:
                    logger.error(f"Error processing chunk {i} of quiz {quiz.id}: {str(e)}")
                    continue
            
            # Mark as processed
            quiz.is_processed = True
            quiz.processing_error = ""
            quiz.save()
            
            logger.info(f"Successfully processed quiz {quiz.id} with {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"Error processing quiz {quiz.id}: {str(e)}")
            quiz.processing_error = str(e)
            quiz.is_processed = False
            quiz.save()

    @staticmethod
    def process_course_assignment(assignment_file):
        """
        Process a course assignment file through the RAG pipeline and create Assignment entry.
        
        Args:
            assignment_file: CourseAssignmentFile instance with file to process
        """
        from .rag_models import Document, DocumentChunk, KnowledgeNode
        from .rag_pipeline import DocumentProcessor, EmbeddingGenerator, get_openai_client
        
        try:
            # Extract text from the assignment file
            file_type = CourseRAGExtension._get_file_type_from_path(assignment_file.file.path)
            content = DocumentProcessor.extract_text_from_file(assignment_file.file.path, file_type)
            if not content or len(content.strip()) < 100:
                assignment_file.processing_error = "Insufficient content extracted from file"
                assignment_file.save()
                return

            # Extract assignment details using AI
            assignment_details = CourseRAGExtension._extract_assignment_details(content)
            
            # Create Assignment entry if details were successfully extracted
            if assignment_details and not assignment_file.assignment:
                CourseRAGExtension._create_assignment_from_details(assignment_file, assignment_details)
            
            # Create a Document entry for the assignment
            document = Document.objects.create(
                title=f"Assignment: {assignment_file.title}",
                content=content[:10000],  # Store first 10k chars
                document_type='course_assignment',
                source_url=assignment_file.file.url if assignment_file.file else '',
                metadata={
                    'course_id': assignment_file.course.id,
                    'course_name': assignment_file.course.name,
                    'assignment_id': assignment_file.id,
                    'file_type': assignment_file.file_type,
                    'original_filename': assignment_file.file.name.split('/')[-1] if assignment_file.file else ''
                }
            )
            
            # Chunk the content
            chunks = DocumentProcessor.intelligent_chunk_text(content, chunk_size=1500)
            
            # Process each chunk
            for i, chunk_data in enumerate(chunks):
                chunk_text = chunk_data['content']
                if len(chunk_text.strip()) < 50:
                    continue
                    
                # Generate embedding for the chunk
                try:
                    embedding = EmbeddingGenerator.generate_embedding(chunk_text)
                    if not embedding:
                        continue
                    
                    # Create document chunk with embedding
                    chunk = DocumentChunk.objects.create(
                        document=document,
                        chunk_index=chunk_data['chunk_index'],
                        content=chunk_text,
                        chunk_type=chunk_data.get('chunk_type', 'assignment'),
                        word_count=chunk_data.get('word_count', len(chunk_text.split())),
                        difficulty_level=chunk_data.get('difficulty_level', 3),
                        topics=chunk_data.get('topics', []),
                        learning_objectives=chunk_data.get('learning_objectives', []),
                        estimated_study_time=chunk_data.get('estimated_study_time', 15),
                        embedding=embedding,
                        course=assignment_file.course
                    )
                    
                    # Create knowledge nodes for the topics
                    topics = chunk_data.get('topics', [])
                    for topic in topics:
                        if len(topic.strip()) >= 3:
                            knowledge_node, created = KnowledgeNode.objects.get_or_create(
                                topic=topic.strip(),
                                defaults={
                                    'description': f'Assignment content about {topic}',
                                    'confidence_score': 0.8,
                                    'metadata': {'source_type': 'assignment', 'course_id': assignment_file.course.id}
                                }
                            )
                            knowledge_node.related_chunks.add(chunk)
                    
                except Exception as e:
                    logger.error(f"Error processing chunk {i} of assignment {assignment_file.id}: {str(e)}")
                    continue
            
            # Mark as processed
            assignment_file.is_processed = True
            assignment_file.processing_error = ""
            assignment_file.save()
            
            logger.info(f"Successfully processed assignment file {assignment_file.id} with {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"Error processing assignment file {assignment_file.id}: {str(e)}")
            assignment_file.processing_error = str(e)
            assignment_file.is_processed = False
            assignment_file.save()

    @staticmethod
    def _extract_enhanced_topics(content: str) -> list:
        """
        Extract topics with enhanced information (title, description, difficulty) using AI.
        """
        try:
            from .rag_pipeline import get_openai_client
            
            client = get_openai_client()
            
            prompt = f"""
            Analyze the following academic syllabus content and extract the main topics. 
            For each topic, provide a title, description, and difficulty level.
            
            Please format your response as a JSON array where each topic is an object with:
            - "title": A concise topic name (max 100 characters)
            - "description": A brief description explaining what this topic covers (max 300 characters)
            - "difficulty": One of "beginner", "intermediate", or "advanced"
            
            Content to analyze:
            {content[:4000]}
            
            Extract 5-12 main topics. Focus on substantial learning topics, not minor details.
            
            Response format:
            [
              {{
                "title": "Image Representation",
                "description": "Understanding how digital images are stored and represented in computer systems, including pixel arrays, color models, and image formats.",
                "difficulty": "intermediate"
              }},
              ...
            ]
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Try to parse JSON response
            import json
            try:
                topics = json.loads(response_text)
                if isinstance(topics, list):
                    # Validate and clean topics
                    valid_topics = []
                    for i, topic in enumerate(topics):
                        if isinstance(topic, dict) and 'title' in topic:
                            title = str(topic.get('title', f'Topic {i+1}')).strip()[:200]
                            description = str(topic.get('description', '')).strip()[:500]
                            difficulty = str(topic.get('difficulty', 'intermediate')).lower()
                            
                            # Validate difficulty
                            if difficulty not in ['beginner', 'intermediate', 'advanced']:
                                difficulty = 'intermediate'
                            
                            valid_topics.append({
                                'title': title,
                                'description': description,
                                'difficulty': difficulty
                            })
                    
                    return valid_topics[:12]  # Limit to 12 topics
            except json.JSONDecodeError:
                # If JSON parsing fails, fall back to simple extraction
                pass
            
        except Exception as e:
            logger.warning(f"Enhanced topic extraction failed: {str(e)}")
        
        # Fallback to simple topic extraction
        return CourseRAGExtension._extract_simple_topics(content)

    @staticmethod
    def _extract_simple_topics(content: str) -> list:
        """
        Fallback method for simple topic extraction.
        """
        try:
            from .rag_pipeline import DocumentProcessor
            topic_names = DocumentProcessor._extract_topics_fallback(content)
            
            simple_topics = []
            for i, name in enumerate(topic_names[:10]):
                simple_topics.append({
                    'title': name.strip()[:200],
                    'description': f"Key topic covering {name.lower()} concepts and applications.",
                    'difficulty': 'intermediate'  # Default difficulty
                })
            
            return simple_topics
        except Exception:
            return [{
                'title': 'Course Topics',
                'description': 'Main topics covered in this course syllabus.',
                'difficulty': 'intermediate'
            }]

    @staticmethod
    def process_course_topics(course_topic):
        """
        Process course syllabus content to extract topics through the RAG pipeline.
        
        Args:
            course_topic: CourseTopic instance with syllabus content to process
        """
        from .rag_models import Document, DocumentChunk, KnowledgeNode
        from .rag_pipeline import DocumentProcessor, EmbeddingGenerator, get_openai_client
        from django.apps import apps
        CourseTopicItem = apps.get_model('courses', 'CourseTopicItem')
        
        try:
            # Get content from either text or file
            content = ""
            if course_topic.syllabus_file:
                file_type = CourseRAGExtension._get_file_type_from_path(course_topic.syllabus_file.path)
                content = DocumentProcessor.extract_text_from_file(course_topic.syllabus_file.path, file_type)
            elif course_topic.syllabus_text:
                content = course_topic.syllabus_text
            
            if not content or len(content.strip()) < 100:
                course_topic.processing_error = "Insufficient syllabus content to process"
                course_topic.save()
                return
            
            # Extract topics using AI
            try:
                client = get_openai_client()
                
                prompt = f"""
                Analyze the following course syllabus and extract the main topics, learning objectives, and key concepts.
                Provide a comprehensive list of specific topics that students will study in this course.
                
                Syllabus Content:
                {content[:4000]}
                
                Extract and return:
                1. Main topics (specific subjects/concepts)
                2. Learning objectives 
                3. Key skills to be developed
                4. Important concepts covered
                
                Format as a JSON object with these fields:
                {{
                    "topics": ["topic1", "topic2", ...],
                    "learning_objectives": ["objective1", "objective2", ...], 
                    "key_skills": ["skill1", "skill2", ...],
                    "concepts": ["concept1", "concept2", ...],
                    "summary": "Brief 2-3 sentence summary of the course"
                }}
                """
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1500,
                    temperature=0.3
                )
                
                response_text = response.choices[0].message.content.strip()
                
                # Parse JSON response
                import json
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    extracted_data = json.loads(json_match.group())
                    
                    # Use the existing response but convert to enhanced format
                    all_topics = []
                    all_topics.extend(extracted_data.get('topics', []))
                    all_topics.extend(extracted_data.get('learning_objectives', []))
                    all_topics.extend(extracted_data.get('key_skills', []))
                    all_topics.extend(extracted_data.get('concepts', []))
                    
                    # Clean and deduplicate topics  
                    unique_topics = list(set([t.strip() for t in all_topics if t.strip()]))[:12]
                    
                    # Convert to enhanced format
                    enhanced_topics = []
                    for i, topic_name in enumerate(unique_topics):
                        enhanced_topics.append({
                            'title': topic_name[:200],
                            'description': f"Key learning area covering {topic_name.lower()} concepts and applications.",
                            'difficulty': 'intermediate'  # Default for existing extraction
                        })
                    
                    course_topic.topics_summary = extracted_data.get('summary', '')
                else:
                    # Fallback to simple topic extraction
                    enhanced_topics = CourseRAGExtension._extract_simple_topics(content)
                    course_topic.topics_summary = f"Course covers {len(enhanced_topics)} main topics"
                
            except Exception as e:
                logger.warning(f"AI topic extraction failed for course topics {course_topic.id}: {str(e)}")
                # Fallback to simple extraction
                enhanced_topics = CourseRAGExtension._extract_simple_topics(content)
                course_topic.topics_summary = f"Course covers {len(enhanced_topics)} main topics"
            
            # Clear existing topic items for this course_topic and create new ones
            CourseTopicItem.objects.filter(course_topic=course_topic).delete()
            
            # Create CourseTopicItem objects
            topic_items = []
            for i, topic_data in enumerate(enhanced_topics):
                topic_item = CourseTopicItem.objects.create(
                    course=course_topic.course,
                    course_topic=course_topic,
                    title=topic_data['title'],
                    description=topic_data['description'], 
                    difficulty=topic_data['difficulty'],
                    order=i + 1,
                    is_completed=False
                )
                topic_items.append(topic_item)
            
            # Update course topic (keep extracted_topics for backward compatibility)
            course_topic.extracted_topics = [topic['title'] for topic in enhanced_topics]
            
            logger.info(f"Created {len(topic_items)} topic items for course topics {course_topic.id}")
            
            # Create a Document entry for the syllabus
            document = Document.objects.create(
                title=f"Syllabus: {course_topic.course.name}",
                content=content[:10000],  # Store first 10k chars
                document_type='course_syllabus',
                source_url=course_topic.syllabus_file.url if course_topic.syllabus_file else '',
                metadata={
                    'course_id': course_topic.course.id,
                    'course_name': course_topic.course.name,
                    'topic_id': course_topic.id,
                    'content_source': course_topic.content_source,
                    'extracted_topics_count': len(course_topic.extracted_topics)
                }
            )
            
            # Chunk the content
            chunks = DocumentProcessor.intelligent_chunk_text(content, chunk_size=1500)
            
            # Process each chunk
            for i, chunk_text in enumerate(chunks):
                if len(chunk_text.strip()) < 50:
                    continue
                    
                # Generate embedding for the chunk
                try:
                    embedding = EmbeddingGenerator.generate_embedding(chunk_text)
                    if not embedding:
                        continue
                    
                    # Use extracted topics for this chunk
                    relevant_topics = [t for t in course_topic.extracted_topics 
                                     if t.lower() in chunk_text.lower()][:5]
                    
                    # Create document chunk with embedding
                    chunk = DocumentChunk.objects.create(
                        document=document,
                        chunk_index=i,
                        content=chunk_text,
                        embedding=embedding,
                        topics=relevant_topics,
                        metadata={
                            'course_id': course_topic.course.id,
                            'course_name': course_topic.course.name,
                            'content_type': 'syllabus'
                        }
                    )
                    
                    # Create knowledge nodes for the topics
                    for topic in relevant_topics:
                        if len(topic.strip()) >= 3:
                            knowledge_node, created = KnowledgeNode.objects.get_or_create(
                                topic=topic.strip(),
                                defaults={
                                    'description': f'Syllabus content about {topic}',
                                    'confidence_score': 0.9,
                                    'metadata': {'source_type': 'syllabus', 'course_id': course_topic.course.id}
                                }
                            )
                            knowledge_node.related_chunks.add(chunk)
                    
                except Exception as e:
                    logger.error(f"Error processing chunk {i} of course topics {course_topic.id}: {str(e)}")
                    continue
            
            # Mark as processed
            course_topic.is_processed = True
            course_topic.processing_error = ""
            course_topic.save()
            
            logger.info(f"Successfully processed course topics {course_topic.id} with {len(course_topic.extracted_topics)} topics and {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"Error processing course topics {course_topic.id}: {str(e)}")
            course_topic.processing_error = str(e)
            course_topic.is_processed = False
            course_topic.save()

    @staticmethod
    def _extract_assignment_details(content):
        """
        Extract assignment details from file content using AI.
        
        Args:
            content: Text content from assignment file
            
        Returns:
            dict: Extracted assignment details or None if failed
        """
        try:
            from .rag_pipeline import get_openai_client
            import json
            import re
            from datetime import datetime, timedelta
            
            client = get_openai_client()
            
            prompt = f"""
            Analyze the following assignment document and extract key details for creating an assignment entry.
            
            Assignment Content:
            {content[:3000]}
            
            Extract and return the following information as JSON:
            {{
                "title": "Assignment title/name",
                "assignment_type": "homework|quiz|exam|project|lab|essay|presentation|discussion|other",
                "description": "Brief description of requirements",
                "due_date": "YYYY-MM-DD" or "YYYY-MM-DD HH:MM" (if specific time mentioned),
                "estimated_hours": number (estimated hours to complete, or null),
                "weight": number (percentage weight in final grade, or null),
                "requirements": ["list", "of", "key", "requirements"],
                "difficulty_level": 1-5 (estimated difficulty)
            }}
            
            Important:
            - If no due date is found, use null
            - For assignment_type, choose the most appropriate from the list
            - Extract actual requirements, not generic statements
            - Be conservative with time estimates
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                extracted_data = json.loads(json_match.group())
                
                # Process due date
                if extracted_data.get('due_date'):
                    try:
                        # Try to parse the date
                        due_date_str = extracted_data['due_date']
                        if len(due_date_str) == 10:  # YYYY-MM-DD format
                            due_date_str += " 23:59"  # Add default time
                        extracted_data['due_date'] = due_date_str
                    except:
                        # If date parsing fails, set to 2 weeks from now as default
                        default_due = datetime.now() + timedelta(weeks=2)
                        extracted_data['due_date'] = default_due.strftime("%Y-%m-%d 23:59")
                else:
                    # Default to 2 weeks from now
                    default_due = datetime.now() + timedelta(weeks=2)
                    extracted_data['due_date'] = default_due.strftime("%Y-%m-%d 23:59")
                
                # Validate assignment_type
                valid_types = ['homework', 'quiz', 'exam', 'project', 'lab', 'essay', 'presentation', 'discussion', 'other']
                if extracted_data.get('assignment_type') not in valid_types:
                    extracted_data['assignment_type'] = 'homework'
                
                return extracted_data
            
            return None
            
        except Exception as e:
            logger.warning(f"Failed to extract assignment details: {str(e)}")
            return None
    
    @staticmethod
    def _create_assignment_from_details(assignment_file, details):
        """
        Create an Assignment entry from extracted details.
        
        Args:
            assignment_file: CourseAssignmentFile instance
            details: Dictionary of extracted assignment details
        """
        try:
            from datetime import datetime
            
            # Import Assignment model
            from django.apps import apps
            Assignment = apps.get_model('courses', 'Assignment')
            
            # Parse due date
            due_date = datetime.strptime(details['due_date'], "%Y-%m-%d %H:%M")
            
            # Create assignment
            assignment = Assignment.objects.create(
                course=assignment_file.course,
                title=details.get('title', assignment_file.title),
                assignment_type=details.get('assignment_type', 'homework'),
                description=details.get('description', ''),
                due_date=due_date,
                estimated_hours=details.get('estimated_hours'),
                weight=details.get('weight'),
                status='not_started'
            )
            
            # Link the assignment file to the created assignment
            assignment_file.assignment = assignment
            assignment_file.save()
            
            logger.info(f"Created assignment {assignment.id} from file {assignment_file.id}")
            
        except Exception as e:
            logger.error(f"Failed to create assignment from file {assignment_file.id}: {str(e)}")
            assignment_file.processing_error = f"Assignment extraction failed: {str(e)}"
            assignment_file.save()


# Add the extension methods to the main RAGPipeline class
def extend_rag_pipeline():
    """Add course processing methods to RAGPipeline class."""
    from .rag_pipeline import RAGPipeline
    
    # Add the methods to the RAGPipeline class
    RAGPipeline.process_course_quiz = CourseRAGExtension.process_course_quiz
    RAGPipeline.process_course_assignment = CourseRAGExtension.process_course_assignment
    RAGPipeline.process_course_topics = CourseRAGExtension.process_course_topics

# Auto-extend when this module is imported
extend_rag_pipeline()
