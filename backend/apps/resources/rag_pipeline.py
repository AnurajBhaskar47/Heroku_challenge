"""
RAG Pipeline for Study Bud - Powered by Heroku pgvector

This module implements the core RAG (Retrieval-Augmented Generation) pipeline
that enables AI-powered study plan creation and modification.

Architecture:
1. Document Processing: Extract and chunk uploaded resources
2. Embedding Generation: Create vector embeddings for semantic search
3. Context Retrieval: Find relevant content based on student queries
4. Study Plan Generation: Use LLM with retrieved context to create/modify plans
"""

import logging
import openai
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from pgvector.django import CosineDistance

from .rag_models import DocumentChunk, StudyPlanContext, KnowledgeGraph, RAGQuery
from .models import Resource
from apps.courses.models import Course
from apps.study_plans.models import StudyPlan

# Configure logging
logger = logging.getLogger(__name__)

# Configure OpenAI client (v1.0+ API)
from openai import OpenAI

# Initialize OpenAI client with explicit configuration
def get_openai_client():
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        raise ValueError("OpenAI API key not found in settings")
    return OpenAI(api_key=api_key)

client = None


class DocumentProcessor:
    """
    Processes uploaded documents and extracts meaningful content chunks.
    """
    
    @staticmethod
    def extract_text_from_file(file_path: str, file_type: str) -> str:
        """Extract text content from various file types."""
        try:
            if file_type.lower() == 'pdf':
                import PyPDF2
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text = ""
                    for page in pdf_reader.pages:
                        text += page.extract_text()
                    return text
            
            elif file_type.lower() in ['docx', 'doc']:
                import docx
                doc = docx.Document(file_path)
                text = ""
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                return text
            
            elif file_type.lower() == 'txt':
                with open(file_path, 'r', encoding='utf-8') as file:
                    return file.read()
            
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def intelligent_chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
        """
        Intelligently chunk text based on semantic boundaries.
        
        This method:
        1. Splits on natural boundaries (paragraphs, sentences)
        2. Maintains context with overlapping chunks
        3. Identifies content types and topics
        """
        
        # Clean and normalize text
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Try multiple splitting strategies for better chunking
        paragraphs = []
        
        # Strategy 1: Split by double newlines (standard paragraphs)
        initial_split = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        # Strategy 2: If we get only 1 paragraph, try single newlines
        if len(initial_split) <= 1:
            initial_split = [p.strip() for p in text.split('\n') if p.strip() and len(p.strip()) > 50]
        
        # Strategy 3: If still only 1 chunk, split by sentences
        if len(initial_split) <= 1:
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
            # Group sentences into paragraphs
            current_para = ""
            for sentence in sentences:
                if len(current_para) + len(sentence) < 500:  # Keep paragraphs reasonable
                    current_para += sentence + ". "
                else:
                    if current_para.strip():
                        initial_split.append(current_para.strip())
                    current_para = sentence + ". "
            if current_para.strip():
                initial_split.append(current_para.strip())
        
        paragraphs = initial_split
        
        chunks = []
        current_chunk = ""
        chunk_index = 0
        
        for paragraph in paragraphs:
            # If adding this paragraph would exceed chunk size, finalize current chunk
            if len(current_chunk) + len(paragraph) > chunk_size and current_chunk:
                chunk_info = DocumentProcessor._analyze_chunk_content(current_chunk)
                chunks.append({
                    'content': current_chunk,
                    'chunk_index': chunk_index,
                    'word_count': len(current_chunk.split()),
                    'chunk_type': chunk_info['type'],
                    'topics': chunk_info['topics'],
                    'difficulty_level': chunk_info['difficulty'],
                    'learning_objectives': chunk_info['learning_objectives'],
                    'estimated_study_time': chunk_info['study_time']
                })
                
                # Start new chunk with overlap
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_text + " " + paragraph
                chunk_index += 1
            else:
                current_chunk += " " + paragraph if current_chunk else paragraph
        
        # Handle the last chunk
        if current_chunk:
            chunk_info = DocumentProcessor._analyze_chunk_content(current_chunk)
            chunks.append({
                'content': current_chunk,
                'chunk_index': chunk_index,
                'word_count': len(current_chunk.split()),
                'chunk_type': chunk_info['type'],
                'topics': chunk_info['topics'],
                'difficulty_level': chunk_info['difficulty'],
                'learning_objectives': chunk_info['learning_objectives'],
                'estimated_study_time': chunk_info['study_time']
            })
        
        return chunks
    
    @staticmethod
    def _analyze_chunk_content(content: str) -> Dict[str, Any]:
        """Analyze chunk content to extract metadata."""
        
        # Determine chunk type based on content patterns
        chunk_type = 'text'  # default
        
        if re.search(r'\b(syllabus|course outline|schedule)\b', content.lower()):
            chunk_type = 'syllabus'
        elif re.search(r'\b(assignment|homework|project|due)\b', content.lower()):
            chunk_type = 'assignment'
        elif re.search(r'\b(quiz|exam|test|midterm|final)\b', content.lower()):
            chunk_type = 'quiz_info'
        elif re.search(r'\b(lecture|chapter|section)\b', content.lower()):
            chunk_type = 'lecture_notes'
        
        # Extract potential topics (this could be enhanced with NLP)
        topics = DocumentProcessor._extract_topics(content)
        
        # Estimate difficulty based on vocabulary complexity
        difficulty = DocumentProcessor._estimate_difficulty(content)
        
        # Extract learning objectives
        learning_objectives = DocumentProcessor._extract_learning_objectives(content)
        
        # Estimate study time (rough heuristic: 2 minutes per 100 words)
        study_time = max(5, len(content.split()) * 0.02)
        
        return {
            'type': chunk_type,
            'topics': topics,
            'difficulty': difficulty,
            'learning_objectives': learning_objectives,
            'study_time': round(study_time, 1)
        }
    
    @staticmethod
    def _extract_topics(content: str) -> List[str]:
        """Extract academic topics from content using AI."""
        try:
            # Limit content length for API efficiency
            if len(content) > 3000:
                content = content[:3000] + "..."
            
            client = get_openai_client()
            
            prompt = f"""Analyze the following academic content and extract the main topics, concepts, and subjects discussed. 
            Focus on:
            - Academic concepts and theories
            - Technical terms and methodologies
            - Key subjects and fields of study
            - Important algorithms, formulas, or principles
            
            Return ONLY a comma-separated list of topics (max 8 topics), no explanations.
            
            Content:
            {content}
            
            Topics:"""
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200
            )
            
            topics_text = response.choices[0].message.content.strip()
            
            # Parse the comma-separated topics
            topics = [topic.strip() for topic in topics_text.split(',') if topic.strip()]
            topics = [topic for topic in topics if len(topic) > 3 and len(topic) < 50]
            
            return topics[:8]  # Limit to 8 topics
            
        except Exception as e:
            logger.warning(f"Failed to extract topics with AI: {str(e)}")
            # Fallback to improved keyword extraction
            return DocumentProcessor._extract_topics_fallback(content)
    
    @staticmethod
    def _extract_topics_fallback(content: str) -> List[str]:
        """Fallback topic extraction using improved patterns."""
        topic_patterns = [
            r'\b(Chapter \d+[:\s]*([^.\n]{10,50}))',        # Chapter titles
            r'\b(Section \d+\.?\d*[:\s]*([^.\n]{10,50}))',  # Section titles
            r'\b(\d+\.\d+[:\s]*([^.\n]{10,50}))',          # Numbered sections
            r'\b(Algorithm|Method|Theorem|Principle|Law|Rule|Concept)[:\s]*([^.\n]{5,40})',  # Academic terms
            r'\b([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})\s*(?:algorithm|method|theorem|principle|law|rule|concept|analysis|approach|technique)',  # Academic concepts
        ]
        
        topics = []
        for pattern in topic_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                # Handle tuple matches from grouped regex
                if isinstance(match, tuple):
                    for part in match:
                        if part.strip() and len(part.strip()) > 5:
                            topics.append(part.strip())
                else:
                    if match.strip() and len(match.strip()) > 5:
                        topics.append(match.strip())
        
        # Clean and filter topics
        cleaned_topics = []
        for topic in topics:
            # Remove common words that aren't actual topics
            if not re.match(r'^(the|and|or|but|in|on|at|to|for|of|with|by)$', topic.lower()):
                cleaned_topics.append(topic)
        
        # Remove duplicates and limit
        return list(set(cleaned_topics))[:8]
    
    @staticmethod
    def _estimate_difficulty(content: str) -> int:
        """Estimate content difficulty based on various factors."""
        words = content.split()
        
        # Count complex words (3+ syllables)
        complex_words = sum(1 for word in words if DocumentProcessor._count_syllables(word) >= 3)
        
        # Calculate average sentence length
        sentences = re.split(r'[.!?]+', content)
        avg_sentence_length = len(words) / max(1, len(sentences))
        
        # Calculate difficulty score
        if complex_words / len(words) > 0.3 and avg_sentence_length > 20:
            return 5  # Very Hard
        elif complex_words / len(words) > 0.2 or avg_sentence_length > 15:
            return 4  # Hard
        elif complex_words / len(words) > 0.15 or avg_sentence_length > 12:
            return 3  # Medium
        elif complex_words / len(words) > 0.1:
            return 2  # Easy
        else:
            return 1  # Very Easy
    
    @staticmethod
    def _count_syllables(word: str) -> int:
        """Simple syllable counting algorithm."""
        word = word.lower()
        vowels = "aeiouy"
        count = 0
        prev_was_vowel = False
        
        for i, char in enumerate(word):
            if char in vowels:
                if not prev_was_vowel:
                    count += 1
                prev_was_vowel = True
            else:
                prev_was_vowel = False
        
        if word.endswith('e') and count > 1:
            count -= 1
        
        return max(1, count)
    
    @staticmethod
    def _extract_learning_objectives(content: str) -> List[str]:
        """Extract learning objectives from content."""
        # Look for common learning objective patterns
        patterns = [
            r'(?:students? will|learners? will|you will|objectives?)[:\s]*([^.\n]+)',
            r'(?:by the end|after completing|upon completion)[^,]*,\s*([^.\n]+)',
            r'(?:understand|learn|master|apply|analyze|evaluate)[:\s]*([^.\n]+)'
        ]
        
        objectives = []
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            objectives.extend([obj.strip() for obj in matches if len(obj.strip()) > 10])
        
        return list(set(objectives))[:5]  # Limit to 5 objectives


class EmbeddingGenerator:
    """
    Generates vector embeddings for semantic search using OpenAI's embedding models.
    """
    
    @staticmethod
    def generate_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
        """Generate embedding for a piece of text."""
        try:
            # Clean and truncate text if too long (OpenAI has token limits)
            cleaned_text = re.sub(r'\s+', ' ', text.strip())
            if len(cleaned_text) > 8000:  # Conservative token limit
                cleaned_text = cleaned_text[:8000]
            
            client = get_openai_client()
            response = client.embeddings.create(
                input=cleaned_text,
                model=model
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            # Return zero vector as fallback
            return [0.0] * 1536


class RAGRetriever:
    """
    Retrieves relevant context for study plan generation using vector similarity search.
    """
    
    @staticmethod
    def retrieve_relevant_chunks(
        query_embedding: List[float],
        course_id: int,
        chunk_types: Optional[List[str]] = None,
        top_k: int = 10,
        similarity_threshold: float = 0.7
    ) -> List[DocumentChunk]:
        """
        Retrieve the most relevant document chunks for a query.
        
        Uses pgvector's cosine similarity for efficient vector search.
        """
        
        queryset = DocumentChunk.objects.filter(course_id=course_id)
        
        if chunk_types:
            queryset = queryset.filter(chunk_type__in=chunk_types)
        
        # Perform vector similarity search
        chunks = queryset.annotate(
            similarity=1 - CosineDistance('embedding', query_embedding)
        ).filter(
            similarity__gte=similarity_threshold
        ).order_by('-similarity')[:top_k]
        
        return list(chunks)
    
    @staticmethod
    def retrieve_contextual_information(
        user_id: int,
        course_id: int,
        query_text: str,
        query_embedding: List[float]
    ) -> Dict[str, Any]:
        """
        Gather all contextual information needed for study plan generation.
        """
        
        try:
            # Get user context
            study_context = StudyPlanContext.objects.filter(
                user_id=user_id,
                course_id=course_id
            ).first()
            
            # Get course information
            course = Course.objects.get(id=course_id)
            
            # Get relevant document chunks
            relevant_chunks = RAGRetriever.retrieve_relevant_chunks(
                query_embedding=query_embedding,
                course_id=course_id,
                top_k=15
            )
            
            # Get knowledge graph information
            knowledge_nodes = KnowledgeGraph.objects.filter(course_id=course_id)
            
            # Get existing study plans for reference
            existing_plans = StudyPlan.objects.filter(
                user_id=user_id,
                course_id=course_id
            ).order_by('-created_at')[:3]
            
            return {
                'study_context': study_context,
                'course': course,
                'relevant_chunks': relevant_chunks,
                'knowledge_nodes': knowledge_nodes,
                'existing_plans': existing_plans,
                'query_text': query_text
            }
            
            
        except Exception as e:
            logger.error(f"Error retrieving contextual information: {str(e)}")
            return {}


class StudyPlanGenerator:
    """
    Generates and modifies study plans using LLM with retrieved context.
    """
    
    @staticmethod
    def generate_study_plan(
        user_id: int,
        course_id: int,
        query_text: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a new study plan using RAG.
        """
        
        # Build the prompt with retrieved context
        prompt = StudyPlanGenerator._build_generation_prompt(context, query_text)
        
        try:
            client = get_openai_client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using more cost-effective model
                messages=[
                    {"role": "system", "content": StudyPlanGenerator._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse the response into a structured study plan
            plan_data = StudyPlanGenerator._parse_ai_response(response.choices[0].message.content)
            
            return plan_data
            
        except Exception as e:
            logger.error(f"Error generating study plan: {str(e)}")
            return {}
    
    @staticmethod
    def _get_system_prompt() -> str:
        """Get the system prompt for the AI assistant."""
        return """You are an expert academic advisor and study plan creator. Your role is to create personalized, effective study plans based on:

1. Student's learning preferences and constraints
2. Course content and requirements  
3. Available study resources
4. Timeline and deadline constraints
5. Academic difficulty progression

Create study plans that are:
- Realistic and achievable
- Properly sequenced (prerequisites first)
- Balanced in workload
- Adaptive to student's schedule
- Focused on learning objectives
- Use SPECIFIC TOPIC NAMES from the provided study materials (not generic "Topic 1", "Topic 2")
- Include MEANINGFUL MILESTONES with actual learning outcomes (not generic "Milestone 1")

CRITICAL: Extract and use the actual topic names, concepts, and subjects mentioned in the study materials. Create specific, actionable milestones based on the content.

Always respond with a valid JSON structure:
{
  "title": "Specific study plan title related to course content",
  "description": "Brief description mentioning key concepts from materials",
  "topics": [
    {
      "id": "unique_topic_id_1",
      "name": "Actual topic name from content (e.g., 'Binary Trees and Traversal')",
      "description": "What this topic covers",
      "difficulty_level": 1-5,
      "estimated_hours": number,
      "prerequisites": ["list of prerequisite topics"],
      "learning_objectives": ["specific learning goals"],
      "completed": false
    }
  ],
  "milestones": [
    {
      "id": "unique_milestone_id_1", 
      "name": "Meaningful milestone (e.g., 'Master Binary Tree Operations')",
      "description": "What student will achieve",
      "target_topics": ["topics covered by this milestone"],
      "week": week_number,
      "deliverable": "concrete outcome",
      "completed": false
    }
  ],
  "schedule": {
    "total_weeks": number,
    "hours_per_week": number,
    "study_sessions": ["recommended schedule"]
  },
  "estimated_total_hours": number,
  "difficulty_progression": "gradual|mixed|front_loaded|back_loaded"
}"""
    
    @staticmethod
    def _build_generation_prompt(context: Dict[str, Any], query_text: str) -> str:
        """Build the prompt with all relevant context."""
        
        prompt_parts = [
            f"Student Request: {query_text}",
            "",
            "=== COURSE INFORMATION ===",
            f"Course: {context['course'].name}",
            f"Credits: {context['course'].credits}",
            f"Instructor: {context['course'].instructor or 'Not specified'}",
            f"Duration: {context['course'].start_date} to {context['course'].end_date}",
        ]
        
        # Add study context if available
        if context.get('study_context'):
            sc = context['study_context']
            prompt_parts.extend([
                "",
                "=== STUDENT PREFERENCES ===",
                f"Preferred daily study time: {sc.preferred_study_time_per_day} hours",
                f"Difficulty progression: {sc.preferred_difficulty_progression}",
                f"Target grade: {sc.target_grade or 'Not specified'}",
                f"Learning style: {json.dumps(sc.learning_style)}",
                f"Available study slots: {json.dumps(sc.available_study_slots)}",
            ])
            
            if sc.assignments:
                prompt_parts.extend([
                    "",
                    "=== ASSIGNMENTS & DEADLINES ===",
                    json.dumps(sc.assignments, indent=2)
                ])
            
            if sc.quiz_schedule:
                prompt_parts.extend([
                    "",
                    "=== QUIZ/EXAM SCHEDULE ===",
                    json.dumps(sc.quiz_schedule, indent=2)
                ])
        
        # Add relevant content chunks
        if context.get('relevant_chunks'):
            prompt_parts.extend([
                "",
                "=== RELEVANT STUDY MATERIALS ===",
            ])
            
            for chunk in context['relevant_chunks'][:8]:  # Limit to prevent prompt overflow
                prompt_parts.extend([
                    f"Resource: {chunk.resource.title}",
                    f"Type: {chunk.chunk_type}",
                    f"Difficulty: {chunk.difficulty_level}/5",
                    f"Topics: {', '.join(chunk.topics)}",
                    f"Content Preview: {chunk.content[:200]}...",
                    f"Study Time: {chunk.estimated_study_time} minutes",
                    ""
                ])
        
        # Add knowledge graph information
        if context.get('knowledge_nodes'):
            prompt_parts.extend([
                "",
                "=== COURSE TOPIC STRUCTURE ===",
            ])
            
            for node in context['knowledge_nodes'][:10]:
                prompt_parts.extend([
                    f"Topic: {node.topic_name}",
                    f"Difficulty: {node.difficulty_level}/5",
                    f"Prerequisites: {', '.join(node.prerequisites) if node.prerequisites else 'None'}",
                    f"Estimated Hours: {node.estimated_study_hours}",
                    ""
                ])
        
        # Extract all topics for emphasis
        all_topics = set()
        if context.get('relevant_chunks'):
            for chunk in context['relevant_chunks']:
                all_topics.update(chunk.topics)
        
        if context.get('knowledge_nodes'):
            for node in context['knowledge_nodes']:
                all_topics.add(node.topic_name)
        
        prompt_parts.extend([
            "",
            "=== INSTRUCTIONS ===",
            "Create a comprehensive, personalized study plan in JSON format.",
            "",
            "IMPORTANT REQUIREMENTS:",
            "1. Use SPECIFIC topic names from the study materials above, not generic labels",
            "2. Create meaningful milestones that reflect actual learning outcomes",
            "3. Reference the actual concepts, algorithms, and theories mentioned in the content",
            "4. Ensure topics build on each other logically",
            "5. Include concrete, measurable learning objectives",
            "",
            f"Available Topics to Reference: {', '.join(sorted(all_topics)) if all_topics else 'Extract from content above'}",
            "",
            "Generate the study plan JSON now:"
        ])
        
        return "\n".join(prompt_parts)
    
    @staticmethod
    def _parse_ai_response(response_text: str) -> Dict[str, Any]:
        """Parse the AI response into structured data."""
        try:
            # Extract JSON from response (handle cases where AI adds explanation)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_data = json.loads(json_str)
                
                # Ensure all topics have unique IDs and completed field
                if 'topics' in parsed_data and isinstance(parsed_data['topics'], list):
                    for i, topic in enumerate(parsed_data['topics']):
                        if isinstance(topic, dict):
                            if not topic.get('id'):
                                topic['id'] = f"topic_{i+1}_{hash(topic.get('name', ''))%10000}"
                            if 'completed' not in topic:
                                topic['completed'] = False
                
                # Ensure all milestones have unique IDs and completed field
                if 'milestones' in parsed_data and isinstance(parsed_data['milestones'], list):
                    for i, milestone in enumerate(parsed_data['milestones']):
                        if isinstance(milestone, dict):
                            if not milestone.get('id'):
                                milestone['id'] = f"milestone_{i+1}_{hash(milestone.get('name', ''))%10000}"
                            if 'completed' not in milestone:
                                milestone['completed'] = False
                
                return parsed_data
            else:
                logger.error("No JSON found in AI response")
                return {}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return {}


class RAGPipeline:
    """
    Main RAG pipeline orchestrator that coordinates all components.
    """
    
    @staticmethod
    def process_uploaded_resource(resource: Resource) -> bool:
        """
        Process an uploaded resource through the RAG pipeline.
        
        This function:
        1. Extracts text from the uploaded file
        2. Chunks the content intelligently
        3. Generates embeddings for each chunk
        4. Stores everything in the database
        """
        
        try:
            with transaction.atomic():
                # Extract text content
                text_content = DocumentProcessor.extract_text_from_file(
                    resource.file.path,
                    resource.resource_type
                )
                
                if not text_content:
                    logger.warning(f"No text extracted from resource {resource.id}")
                    return False
                
                # Chunk the content
                chunks = DocumentProcessor.intelligent_chunk_text(text_content)
                
                # Generate embeddings and create chunk objects
                for chunk_data in chunks:
                    embedding = EmbeddingGenerator.generate_embedding(chunk_data['content'])
                    
                    DocumentChunk.objects.create(
                        resource=resource,
                        course=resource.course,
                        content=chunk_data['content'],
                        chunk_type=chunk_data['chunk_type'],
                        chunk_index=chunk_data['chunk_index'],
                        word_count=chunk_data['word_count'],
                        difficulty_level=chunk_data['difficulty_level'],
                        topics=chunk_data['topics'],
                        learning_objectives=chunk_data['learning_objectives'],
                        estimated_study_time=chunk_data['estimated_study_time'],
                        embedding=embedding
                    )
                
                logger.info(f"Successfully processed resource {resource.id} into {len(chunks)} chunks")
                return True
                
        except Exception as e:
            logger.error(f"Error processing resource {resource.id}: {str(e)}")
            return False
    
    @staticmethod
    def generate_study_plan_from_rag(
        user_id: int,
        course_id: int,
        query_text: str
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a study plan using the full RAG pipeline.
        """
        
        try:
            # Generate query embedding
            query_embedding = EmbeddingGenerator.generate_embedding(query_text)
            
            # Retrieve contextual information
            context = RAGRetriever.retrieve_contextual_information(
                user_id=user_id,
                course_id=course_id,
                query_text=query_text,
                query_embedding=query_embedding
            )
            
            # Generate study plan
            plan_data = StudyPlanGenerator.generate_study_plan(
                user_id=user_id,
                course_id=course_id,
                query_text=query_text,
                context=context
            )
            
            # Log the query for analytics
            RAGQuery.objects.create(
                user_id=user_id,
                query_text=query_text,
                query_type='study_plan_creation',
                query_embedding=query_embedding,
                retrieved_chunks=[chunk.id for chunk in context.get('relevant_chunks', [])],
                generated_response=json.dumps(plan_data)
            )
            
            return plan_data
            
        except Exception as e:
            logger.error(f"Error in RAG study plan generation: {str(e)}")
            return None

    def answer_question_with_context(
        self,
        user,
        question: str,
        course=None,
        context_type: str = 'general'
    ) -> Dict[str, Any]:
        """
        Answer a student's question using RAG with context from uploaded resources.
        
        Args:
            user: Django User object
            question: Student's question
            course: Optional Course object for context
            context_type: Type of context ('general', 'specific', 'homework')
            
        Returns:
            Dict containing answer, sources, confidence, etc.
        """
        try:
            logger.info(f"Processing question: {question[:100]}...")
            
            # Generate embedding for the question
            question_embedding = EmbeddingGenerator.generate_embedding(question)
            
            # Retrieve relevant context
            context = RAGRetriever.retrieve_contextual_information(
                user_id=user.id,
                course_id=course.id if course else None,
                query_text=question,
                query_embedding=question_embedding
            )
            
            # Build context-aware prompt
            system_prompt = """You are a helpful AI tutor. Answer the student's question using the provided context from their study materials. 

Guidelines:
- Use the context to provide accurate, relevant answers
- If the context doesn't contain enough information, say so honestly
- Cite sources when referencing specific material
- Keep explanations clear and educational
- Encourage further learning
"""
            
            # Build user prompt with context
            relevant_chunks = context.get('relevant_chunks', [])
            context_text = "\n\n".join([
                f"Source: {chunk.resource.title}\n{chunk.content}"
                for chunk in relevant_chunks[:5]  # Use top 5 most relevant chunks
            ])
            
            user_prompt = f"""Context from study materials:
{context_text}

Student's Question: {question}

Please provide a helpful answer based on the context above."""
            
            # Get AI response
            client = get_openai_client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more factual responses
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            
            # Prepare sources information
            sources = []
            for chunk in relevant_chunks[:3]:  # Include top 3 sources
                sources.append({
                    'title': chunk.resource.title,
                    'resource_type': chunk.resource.resource_type,
                    'chunk_content': chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                    'confidence': float(getattr(chunk, 'similarity', 0.8))
                })
            
            # Calculate confidence based on context relevance
            confidence = 0.8 if relevant_chunks else 0.3
            
            # Log the query for analytics
            RAGQuery.objects.create(
                user=user,
                query_text=question,
                query_type='question_answer',
                query_embedding=question_embedding,
                retrieved_chunks=[chunk.id for chunk in relevant_chunks],
                generated_response=answer
            )
            
            return {
                'answer': answer,
                'sources': sources,
                'confidence': confidence,
                'context_used': len(relevant_chunks) > 0,
                'rag_context_used': True
            }
            
        except Exception as e:
            logger.error(f"Error answering question: {str(e)}")
            return {
                'answer': f"I apologize, but I encountered an error while processing your question: {str(e)}\n\nPlease try rephrasing your question or contact support if the issue persists.",
                'sources': [],
                'confidence': 0.1,
                'context_used': False,
                'rag_context_used': False
            }
    
    def generate_contextual_study_plan(
        self,
        user,
        course,
        query: str,
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a study plan based on user preferences and available resources.
        
        Args:
            user: Django User object
            course: Course object
            query: Natural language description of what to study
            preferences: Dict with study preferences (difficulty, hours, etc.)
            
        Returns:
            Dict containing study plan data
        """
        try:
            logger.info(f"Generating study plan for query: {query[:100]}...")
            
            # Generate embedding for the query
            query_embedding = EmbeddingGenerator.generate_embedding(query)
            
            # Retrieve relevant context from course resources
            context = RAGRetriever.retrieve_contextual_information(
                user_id=user.id,
                course_id=course.id,
                query_text=query,
                query_embedding=query_embedding
            )
            
            # Extract preferences
            study_hours = preferences.get('study_hours', 10)
            difficulty = preferences.get('difficulty_progression', 'moderate')
            target_grade = preferences.get('target_grade', 'B+')
            priority_topics = preferences.get('priority_topics', [])
            
            # Build context for study plan generation
            relevant_chunks = context.get('relevant_chunks', [])
            topics_from_resources = set()
            for chunk in relevant_chunks:
                topics_from_resources.update(chunk.topics)
            
            # Generate study plan using LLM
            plan_data = self.generate_study_plan_from_rag(
                user_id=user.id,
                course_id=course.id,
                query_text=f"""
                Create a study plan for: {query}
                
                Course: {course.name}
                Available study hours: {study_hours}
                Difficulty preference: {difficulty}
                Target grade: {target_grade}
                Priority topics: {', '.join(priority_topics)}
                Available topics from resources: {', '.join(list(topics_from_resources)[:10])}
                """
            )
            
            if not plan_data:
                # Fallback plan generation
                plan_data = self._generate_fallback_study_plan(
                    query, course, study_hours, difficulty, topics_from_resources
                )
            
            # Create and save the study plan
            from apps.study_plans.models import StudyPlan
            study_plan = StudyPlan.objects.create(
                user=user,
                course=course,
                title=plan_data.get('title', f'AI Study Plan for {course.name}'),
                description=plan_data.get('description', f'Generated study plan for: {query}'),
                status='draft',
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=plan_data.get('duration_days', 14)),
                plan_data=plan_data,
                progress_percentage=0.0
            )
            
            return {
                'success': True,
                'study_plan_id': study_plan.id,
                'title': study_plan.title,
                'description': study_plan.description,
                'plan_data': plan_data,
                'resources_used': len(relevant_chunks),
                'rag_context_used': True
            }
            
        except Exception as e:
            logger.error(f"Error generating study plan: {str(e)}")
            raise
    
    def _generate_fallback_study_plan(
        self,
        query: str,
        course,
        study_hours: int,
        difficulty: str,
        topics: set
    ) -> Dict[str, Any]:
        """Generate a basic study plan when AI generation fails."""
        
        # Create basic plan structure
        topics_list = list(topics)[:8] if topics else [
            "Introduction", "Core Concepts", "Practice Problems", "Review"
        ]
        
        hours_per_topic = max(1, study_hours // len(topics_list))
        
        plan_topics = []
        for i, topic in enumerate(topics_list):
            plan_topics.append({
                'id': f'topic_{i+1}',
                'title': topic,
                'description': f'Study {topic} thoroughly',
                'estimated_hours': hours_per_topic,
                'difficulty_level': 3 if difficulty == 'moderate' else (2 if difficulty == 'easy' else 4),
                'resources': [],
                'completed': False
            })
        
        return {
            'title': f'Study Plan for {course.name}',
            'description': f'AI-generated study plan for: {query}',
            'topics': plan_topics,
            'total_estimated_hours': study_hours,
            'difficulty_level': 3,
            'duration_days': max(7, study_hours // 2),
            'generated_by': 'ai_assistant',
            'generated_at': timezone.now().isoformat()
        }




