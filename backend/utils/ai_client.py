"""
AI Client for Google Gemini integration.

This module provides a wrapper around Google's Gemini API for generating
explanations, study plans, and other AI-powered content.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from django.conf import settings
from django.core.cache import cache

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None

logger = logging.getLogger(__name__)


class AIClient:
    """
    Client for interacting with Google Gemini AI.

    Provides methods for generating explanations, study plans, and chat responses.
    """

    def __init__(self):
        """Initialize the AI client."""
        self.api_key = getattr(settings, 'GOOGLE_GEMINI_API_KEY', '')
        self.cache_duration = getattr(
            settings, 'AI_CACHE_DURATION', 3600)  # 1 hour
        self.fallback_enabled = getattr(settings, 'AI_FALLBACK_ENABLED', True)

        if GENAI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-pro')
                self.available = True
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self.available = False
        else:
            self.available = False
            self.model = None

    def is_available(self) -> bool:
        """Check if the AI client is available."""
        return self.available and bool(self.api_key)

    def _get_cache_key(self, prefix: str, **kwargs) -> str:
        """Generate a cache key for the given parameters."""
        key_data = json.dumps(kwargs, sort_keys=True)
        return f"ai_client:{prefix}:{hash(key_data)}"

    def _call_gemini(self, prompt: str, cache_key: str = None) -> str:
        """
        Call the Gemini API with the given prompt.

        Args:
            prompt: The prompt to send to Gemini
            cache_key: Optional cache key for caching the response

        Returns:
            The response text from Gemini

        Raises:
            Exception: If the API call fails and fallback is not available
        """
        if not self.is_available():
            if self.fallback_enabled:
                return self._fallback_response(prompt)
            raise Exception("Gemini AI is not available")

        # Check cache first
        if cache_key:
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.debug(f"Using cached response for key: {cache_key}")
                return cached_response

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Cache the response
            if cache_key and response_text:
                cache.set(cache_key, response_text, self.cache_duration)

            logger.info(
                f"Generated AI response (length: {len(response_text)})")
            return response_text

        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            if self.fallback_enabled:
                return self._fallback_response(prompt)
            raise

    def _fallback_response(self, prompt: str) -> str:
        """
        Generate a fallback response when AI is unavailable.

        Args:
            prompt: The original prompt

        Returns:
            A generic fallback response
        """
        logger.warning("Using fallback response - AI service unavailable")

        if "explain" in prompt.lower():
            return ("I apologize, but I'm currently unable to provide a detailed explanation. "
                    "The AI service is temporarily unavailable. Please try again later or "
                    "consult your course materials for information on this topic.")
        elif "study plan" in prompt.lower():
            return json.dumps({
                "topics": ["Review course materials", "Complete assignments", "Practice problems"],
                "milestones": [{"title": "Week 1: Course Overview", "due_date": "2024-01-07"}],
                "estimated_hours": 20,
                "difficulty_level": 3,
                "note": "This is a basic fallback study plan. AI service is temporarily unavailable."
            })
        else:
            return ("I'm currently unable to process your request as the AI service is "
                    "temporarily unavailable. Please try again later.")

    def generate_explanation(
        self,
        topic: str,
        context: str = "",
        difficulty_level: int = 3,
        explanation_type: str = "detailed"
    ) -> str:
        """
        Generate an explanation for a given topic.

        Args:
            topic: The topic to explain
            context: Additional context for the explanation
            difficulty_level: Difficulty level from 1 (beginner) to 5 (expert)
            explanation_type: Type of explanation ('simple', 'detailed', 'example', 'step_by_step')

        Returns:
            A detailed explanation of the topic
        """
        # Create cache key
        cache_key = self._get_cache_key(
            "explanation",
            topic=topic,
            context=context,
            difficulty=difficulty_level,
            type=explanation_type
        )

        # Build the prompt
        difficulty_map = {
            1: "beginner (assume no prior knowledge)",
            2: "novice (basic understanding)",
            3: "intermediate (some experience)",
            4: "advanced (strong background)",
            5: "expert (extensive knowledge)"
        }

        difficulty_desc = difficulty_map.get(difficulty_level, "intermediate")

        type_instructions = {
            'simple': "Provide a simple, easy-to-understand explanation.",
            'detailed': "Provide a comprehensive, detailed explanation with examples.",
            'example': "Focus on concrete examples and practical applications.",
            'step_by_step': "Break down the explanation into clear, sequential steps."
        }

        type_instruction = type_instructions.get(
            explanation_type, "Provide a detailed explanation.")

        prompt = f"""
As an AI study assistant, please explain the following topic for a {difficulty_desc} level student.

Topic: {topic}

{f"Additional Context: {context}" if context else ""}

Instructions: {type_instruction}

Please structure your explanation clearly and make it engaging for learning. Use simple language when possible, but don't oversimplify technical concepts. Include relevant examples where appropriate.

Explanation:
"""

        return self._call_gemini(prompt, cache_key)

    def generate_study_plan(
        self,
        course_info: Dict[str, Any],
        assignments: List[Dict[str, Any]],
        preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate a study plan for a course.

        Args:
            course_info: Information about the course
            assignments: List of assignments for the course
            preferences: User preferences for the study plan

        Returns:
            A structured study plan as a dictionary
        """
        preferences = preferences or {}

        # Create cache key
        cache_key = self._get_cache_key(
            "study_plan",
            course=course_info.get('name', ''),
            num_assignments=len(assignments),
            preferences=preferences
        )

        # Build the prompt
        prompt = f"""
As an AI study assistant, create a comprehensive study plan for the following course:

Course Information:
- Name: {course_info.get('name', 'Unknown Course')}
- Code: {course_info.get('code', 'N/A')}
- Description: {course_info.get('description', 'No description available')}
- Difficulty Level: {course_info.get('difficulty_level', 3)}/5
- Credits: {course_info.get('credits', 3)}

Assignments ({len(assignments)}):
"""

        for i, assignment in enumerate(assignments, 1):
            prompt += f"""
{i}. {assignment.get('title', 'Assignment')} ({assignment.get('type', 'homework')})
   - Due: {assignment.get('due_date', 'TBD')}
   - Estimated Hours: {assignment.get('estimated_hours', 'Unknown')}
   - Weight: {assignment.get('weight', 'Unknown')}%
"""

        prompt += f"""
User Preferences:
- Study Hours per Week: {preferences.get('study_hours_per_week', 5)}
- Duration: {preferences.get('duration_weeks', 4)} weeks
- Difficulty Preference: {preferences.get('difficulty_preference', 3)}/5
- Focus Areas: {', '.join(preferences.get('focus_areas', []))}

Please generate a comprehensive study plan in JSON format with the following structure:
{{
    "topics": [
        {{
            "id": "topic_1",
            "title": "Topic Name",
            "description": "Brief description",
            "estimated_hours": 2.0,
            "difficulty_level": 3,
            "resources": ["resource1", "resource2"],
            "completed": false
        }}
    ],
    "milestones": [
        {{
            "id": "milestone_1",
            "title": "Milestone Name",
            "description": "Description",
            "due_date": "2024-01-15",
            "completed": false,
            "progress_weight": 0.2
        }}
    ],
    "schedule": [
        {{
            "week": 1,
            "focus": "Week focus area",
            "hours": 5,
            "activities": ["activity1", "activity2"]
        }}
    ],
    "estimated_hours": 20,
    "difficulty_level": 3,
    "tips": ["Study tip 1", "Study tip 2"]
}}

Study Plan:
"""

        response = self._call_gemini(prompt, cache_key)

        # Try to parse as JSON, fallback to text if it fails
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.warning(
                "Failed to parse study plan as JSON, returning text response")
            return {
                "error": "Failed to parse JSON response",
                "raw_response": response,
                "estimated_hours": preferences.get('duration_weeks', 4) * preferences.get('study_hours_per_week', 5),
                "difficulty_level": preferences.get('difficulty_preference', 3)
            }

    def chat_with_assistant(self, message: str, context: Dict[str, Any] = None) -> str:
        """
        Chat with the AI assistant.

        Args:
            message: The user's message
            context: Conversation context

        Returns:
            The assistant's response
        """
        context = context or {}

        # Create cache key (don't cache chat responses to maintain conversation flow)
        # cache_key = self._get_cache_key("chat", message=message[:100])

        prompt = f"""
You are an AI study assistant for the Study Bud application. You help students with their learning by:
- Answering questions about academic topics
- Providing study advice and strategies
- Helping with course planning and organization
- Offering motivation and support

User Context:
- Username: {context.get('username', 'Student')}
- Current Course: {context.get('current_course', {}).get('name', 'None selected')}

Previous Conversation Context: {context.get('last_message', 'None')}

User Message: {message}

Please provide a helpful, friendly, and informative response. Keep it concise but thorough. If the question is not related to studying or education, politely redirect the conversation back to academic topics.

Assistant Response:
"""

        return self._call_gemini(prompt)

    def get_service_info(self) -> Dict[str, Any]:
        """
        Get information about the AI service.

        Returns:
            Dictionary containing service information
        """
        return {
            'service_name': 'Google Gemini',
            'available': self.is_available(),
            'model': 'gemini-pro' if self.available else None,
            'features': ['explanations', 'study_plans', 'chat'],
            'cache_enabled': bool(cache),
            'cache_duration': self.cache_duration,
            'fallback_enabled': self.fallback_enabled
        }
