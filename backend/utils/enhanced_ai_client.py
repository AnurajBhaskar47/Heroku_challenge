"""
Enhanced AI Client with feature flags and multiple service support.

This module provides an abstraction layer over various AI services with
support for vector search, embeddings, and future pgvector integration.
"""

import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q

from .ai_client import AIClient

logger = logging.getLogger(__name__)


class EnhancedAIClient:
    """
    Enhanced AI client with feature flags and multiple service support.

    Supports:
    - Multiple AI services (Gemini, future OpenAI, etc.)
    - Vector search capabilities (pgvector-ready)
    - Embedding generation
    - Smart fallbacks
    - Feature flag-based functionality
    """

    def __init__(self):
        """Initialize the enhanced AI client."""
        self.ai_client = AIClient()

        # Feature flags from settings
        self.vector_search_enabled = getattr(
            settings, 'USE_VECTOR_SEARCH', False)
        self.embedding_service = getattr(
            settings, 'EMBEDDING_SERVICE', 'local')
        self.cache_duration = getattr(settings, 'AI_CACHE_DURATION', 3600)
        self.fallback_enabled = getattr(settings, 'AI_FALLBACK_ENABLED', True)

        # Initialize embedding client based on service type
        self._init_embedding_service()

        logger.info(f"Enhanced AI client initialized - Vector search: {self.vector_search_enabled}, "
                    f"Embedding service: {self.embedding_service}")

    def _init_embedding_service(self):
        """Initialize the embedding service based on configuration."""
        if self.embedding_service == 'local':
            # Local embedding service (stub for now)
            self.embedding_client = None
        elif self.embedding_service == 'heroku':
            # Heroku AI service integration (future)
            self.embedding_client = None
        elif self.embedding_service == 'openai':
            # OpenAI embeddings (future)
            self.embedding_client = None
        else:
            self.embedding_client = None

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to generate embeddings for

        Returns:
            List of embedding vectors
        """
        if not self.vector_search_enabled:
            logger.warning(
                "Vector search is disabled, returning empty embeddings")
            return [[] for _ in texts]

        if self.embedding_service == 'local':
            return self._generate_local_embeddings(texts)
        elif self.embedding_service == 'heroku':
            return self._generate_heroku_embeddings(texts)
        elif self.embedding_service == 'openai':
            return self._generate_openai_embeddings(texts)
        else:
            logger.warning(
                f"Unknown embedding service: {self.embedding_service}")
            return [[] for _ in texts]

    def _generate_local_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using local service (stub implementation)."""
        logger.info(f"Generating local embeddings for {len(texts)} texts")

        # Stub implementation - in production, this would use a local embedding model
        # For now, return random-like embeddings based on text hash
        embeddings = []
        for text in texts:
            # Create a deterministic "embedding" based on text content
            # This is just for development - real embeddings would be much more sophisticated
            text_hash = hash(text)
            embedding = [(text_hash >> i) %
                         1000 / 1000.0 for i in range(384)]  # 384-dim vector
            embeddings.append(embedding)

        return embeddings

    def _generate_heroku_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Heroku AI service (future implementation)."""
        logger.info(f"Generating Heroku embeddings for {len(texts)} texts")

        # Placeholder for future Heroku AI integration
        # This would integrate with Heroku's AI services once available
        return self._generate_local_embeddings(texts)  # Fallback for now

    def _generate_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI API (future implementation)."""
        logger.info(f"Generating OpenAI embeddings for {len(texts)} texts")

        # Placeholder for future OpenAI integration
        # This would use OpenAI's embedding API
        return self._generate_local_embeddings(texts)  # Fallback for now

    def semantic_search(
        self,
        query: str,
        filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Perform semantic search on resources.

        Args:
            query: Search query
            filters: Additional filters (resource_type, limit, etc.)

        Returns:
            Dictionary with search results and metadata
        """
        filters = filters or {}
        limit = filters.get('limit', 10)
        similarity_threshold = filters.get('similarity_threshold', 0.5)
        resource_type = filters.get('resource_type')

        if not self.vector_search_enabled:
            logger.info(
                "Vector search disabled, using keyword search fallback")
            return self._keyword_search_fallback(query, filters)

        try:
            # Generate embedding for the query
            query_embeddings = self.generate_embeddings([query])
            if not query_embeddings or not query_embeddings[0]:
                raise Exception("Failed to generate query embedding")

            query_embedding = query_embeddings[0]

            # Perform vector search (this would use pgvector in production)
            results = self._vector_search(query_embedding, filters)

            return {
                'results': results[:limit],
                'service_used': f'vector_search_{self.embedding_service}',
                'query_embedding_size': len(query_embedding),
                'total_matches': len(results)
            }

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            if self.fallback_enabled:
                return self._keyword_search_fallback(query, filters)
            raise

    def _vector_search(self, query_embedding: List[float], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search.

        Args:
            query_embedding: Query embedding vector
            filters: Search filters

        Returns:
            List of matching results with similarity scores
        """
        # Import here to avoid circular imports
        from apps.resources.models import Resource

        # In production with pgvector, this would be a vector similarity query
        # For now, we'll use a simple fallback that filters by content

        resources = Resource.objects.all()

        # Apply filters
        resource_type = filters.get('resource_type')
        if resource_type:
            resources = resources.filter(resource_type=resource_type)

        results = []
        for resource in resources:
            # Simulate similarity calculation (in production, this would be pgvector)
            # For now, use a simple text matching score
            similarity = self._calculate_text_similarity(
                resource.title + " " + resource.description,
                # Use first 10 dims as keywords
                " ".join([str(x) for x in query_embedding[:10]])
            )

            if similarity >= filters.get('similarity_threshold', 0.5):
                results.append({
                    'id': resource.id,
                    'title': resource.title,
                    'description': resource.description,
                    'url': resource.url,
                    'resource_type': resource.resource_type,
                    'similarity_score': similarity,
                    'rating': float(resource.rating) if resource.rating else None,
                    'view_count': resource.view_count
                })

        # Sort by similarity score
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results

    def _keyword_search_fallback(self, query: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback keyword search when vector search is unavailable.

        Args:
            query: Search query
            filters: Search filters

        Returns:
            Dictionary with search results
        """
        from apps.resources.models import Resource

        # Simple text search
        resources = Resource.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(subject__icontains=query)
        )

        # Apply filters
        resource_type = filters.get('resource_type')
        if resource_type:
            resources = resources.filter(resource_type=resource_type)

        limit = filters.get('limit', 10)
        results = []

        for resource in resources[:limit]:
            results.append({
                'id': resource.id,
                'title': resource.title,
                'description': resource.description,
                'url': resource.url,
                'resource_type': resource.resource_type,
                'similarity_score': 0.8,  # Default score for keyword matches
                'rating': float(resource.rating) if resource.rating else None,
                'view_count': resource.view_count
            })

        return {
            'results': results,
            'service_used': 'keyword_search_fallback',
            'total_matches': resources.count()
        }

    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate simple text similarity (placeholder for real vector similarity).

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0 and 1
        """
        # Simple word overlap similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())

        if not words1 or not words2:
            return 0.0

        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))

        return intersection / union if union > 0 else 0.0

    def generate_enhanced_study_plan(
        self,
        course_info: Dict[str, Any],
        assignments: List[Dict[str, Any]],
        preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate an enhanced study plan with AI and data insights.

        Args:
            course_info: Course information
            assignments: List of assignments
            preferences: User preferences

        Returns:
            Enhanced study plan dictionary
        """
        preferences = preferences or {}

        # Use the base AI client for plan generation
        base_plan = self.ai_client.generate_study_plan(
            course_info, assignments, preferences)

        # Enhance with additional features
        enhanced_plan = self._enhance_study_plan(
            base_plan, course_info, preferences)

        return enhanced_plan

    def _enhance_study_plan(
        self,
        base_plan: Dict[str, Any],
        course_info: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enhance a basic study plan with additional AI features.

        Args:
            base_plan: Base study plan from AI
            course_info: Course information
            preferences: User preferences

        Returns:
            Enhanced study plan
        """
        enhanced = base_plan.copy()

        # Add metadata
        enhanced['metadata'] = {
            'generation_method': 'enhanced_ai',
            'vector_search_enabled': self.vector_search_enabled,
            'embedding_service': self.embedding_service,
            'generated_at': datetime.now().isoformat(),
            'course_difficulty': course_info.get('difficulty_level', 3),
            'personalization_level': 'basic'
        }

        # Add resource recommendations if vector search is enabled
        if self.vector_search_enabled:
            try:
                course_topics = [course_info.get(
                    'name', ''), course_info.get('description', '')]
                resource_recommendations = self.semantic_search(
                    query=' '.join(course_topics),
                    filters={'limit': 5, 'resource_type': None}
                )
                enhanced['recommended_resources'] = resource_recommendations.get(
                    'results', [])
            except Exception as e:
                logger.error(f"Failed to get resource recommendations: {e}")
                enhanced['recommended_resources'] = []

        # Add study strategy recommendations
        enhanced['study_strategies'] = self._generate_study_strategies(
            course_info, preferences)

        return enhanced

    def _generate_study_strategies(
        self,
        course_info: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> List[str]:
        """
        Generate study strategies based on course and user preferences.

        Args:
            course_info: Course information
            preferences: User preferences

        Returns:
            List of study strategy recommendations
        """
        strategies = []

        difficulty = course_info.get('difficulty_level', 3)
        study_hours = preferences.get('study_hours_per_week', 5)

        # Basic strategy recommendations based on difficulty and time
        if difficulty >= 4:
            strategies.append(
                "Break complex topics into smaller, manageable chunks")
            strategies.append(
                "Use active recall techniques for better retention")

        if study_hours <= 3:
            strategies.append(
                "Focus on high-impact study sessions with the Pomodoro technique")
            strategies.append(
                "Prioritize understanding key concepts over memorization")

        if study_hours >= 8:
            strategies.append(
                "Include regular review sessions to reinforce learning")
            strategies.append(
                "Allocate time for practice problems and application exercises")

        # Default strategies
        strategies.extend([
            "Create summary notes after each study session",
            "Form study groups with classmates when possible",
            "Use spaced repetition for long-term retention"
        ])

        return strategies

    def generate_recommendations(
        self,
        user_context: Dict[str, Any],
        filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized study recommendations.

        Args:
            user_context: User context information
            filters: Additional filters

        Returns:
            Dictionary with recommendations and reasoning
        """
        filters = filters or {}
        limit = filters.get('limit', 5)

        # Generate recommendations based on user context
        recommendations = []
        reasoning = "Based on your study preferences and course history"

        # Use semantic search if available
        if self.vector_search_enabled and user_context.get('courses'):
            try:
                # Create search query from user's courses
                course_topics = []
                for course in user_context.get('courses', []):
                    course_topics.extend(
                        [course.get('name', ''), course.get('subject', '')])

                search_query = ' '.join(course_topics)
                search_results = self.semantic_search(
                    query=search_query,
                    filters={'limit': limit * 2}  # Get more results to filter
                )

                recommendations = search_results.get('results', [])[:limit]
                reasoning = f"Based on semantic analysis of your courses: {', '.join([c.get('name', '') for c in user_context.get('courses', [])])}"

            except Exception as e:
                logger.error(
                    f"Failed to generate semantic recommendations: {e}")

        # Fallback to simple recommendations
        if not recommendations:
            recommendations = self._generate_fallback_recommendations(
                user_context, filters)
            reasoning = "Based on general study best practices and your preferences"

        return {
            'recommendations': recommendations,
            'reasoning': reasoning,
            'confidence_score': 0.75 if self.vector_search_enabled else 0.6,
            'service_used': f'enhanced_ai_{self.embedding_service}'
        }

    def _generate_fallback_recommendations(
        self,
        user_context: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate fallback recommendations when advanced features are unavailable.

        Args:
            user_context: User context
            filters: Filters

        Returns:
            List of basic recommendations
        """
        # Simple rule-based recommendations
        recommendations = [
            {
                'type': 'study_technique',
                'title': 'Active Recall Practice',
                'description': 'Test yourself regularly instead of just re-reading notes',
                'confidence': 0.8,
                'category': 'technique'
            },
            {
                'type': 'study_technique',
                'title': 'Spaced Repetition',
                'description': 'Review material at increasing intervals for better retention',
                'confidence': 0.8,
                'category': 'technique'
            },
            {
                'type': 'resource',
                'title': 'Khan Academy',
                'description': 'Free online courses and tutorials',
                'url': 'https://www.khanacademy.org/',
                'confidence': 0.7,
                'category': 'resource'
            }
        ]

        return recommendations[:filters.get('limit', 5)]

    def get_service_info(self) -> Dict[str, Any]:
        """
        Get information about the enhanced AI service.

        Returns:
            Dictionary with service information
        """
        base_info = self.ai_client.get_service_info()

        enhanced_info = {
            **base_info,
            'service_name': 'Enhanced Study Bud AI',
            'features': base_info['features'] + ['semantic_search', 'recommendations', 'embeddings'],
            'vector_search_enabled': self.vector_search_enabled,
            'embedding_service': self.embedding_service,
            'primary_service': 'gemini',
            'fallback_services': ['keyword_search', 'rule_based'],
            'version': '1.0.0'
        }

        return enhanced_info
