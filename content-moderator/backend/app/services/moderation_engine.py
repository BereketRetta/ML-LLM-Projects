import openai
import json
from typing import Dict, List, Tuple, Any, Optional
import logging
from app.core.config import get_settings

settings = get_settings()

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

logger = logging.getLogger(__name__)


class ModerationEngine:
    """Core AI Content Moderation Engine using OpenAI"""
    
    def __init__(self, 
                 model: str = settings.OPENAI_MODEL,
                 default_sensitivity: float = settings.DEFAULT_SENSITIVITY):
        """
        Initialize the moderation engine.
        
        Args:
            model: The OpenAI model to use for moderation
            default_sensitivity: Default threshold for flagging content (0-1)
        """
        self.model = model
        self.default_sensitivity = default_sensitivity
        self.categories = settings.MODERATION_CATEGORIES
    
    async def moderate_content(self, 
                             content: str, 
                             user_preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Moderate content based on user preferences or default settings.
        
        Args:
            content: The text content to moderate
            user_preferences: Optional custom user preferences
            
        Returns:
            Dict containing moderation results, scores, and explanations
        """
        # Apply user preferences if provided
        sensitivity = user_preferences.get('sensitivity', self.default_sensitivity) if user_preferences else self.default_sensitivity
        
        # Get category-specific thresholds from user preferences or use default
        category_thresholds = {}
        if user_preferences and 'category_thresholds' in user_preferences:
            category_thresholds = user_preferences['category_thresholds']
        
        # Example of custom category priorities (higher weight = more important to user)
        category_weights = {}
        if user_preferences and 'category_weights' in user_preferences:
            category_weights = user_preferences['category_weights']
        
        try:
            # Call OpenAI for content analysis
            scores, details = await self._analyze_with_openai(content, user_preferences)
            
            # Process results based on sensitivity and preferences
            results = self._process_moderation_results(scores, details, sensitivity, category_thresholds, category_weights)
            
            return results
            
        except Exception as e:
            logger.error(f"Moderation error: {str(e)}")
            return {
                "error": str(e),
                "flagged": False,  # Default to not flagged on error
                "scores": {},
                "explanations": ["Error during moderation analysis."]
            }
    
    async def _analyze_with_openai(self, content: str, user_preferences: Optional[Dict[str, Any]]) -> Tuple[Dict[str, float], Dict[str, Any]]:
        """
        Analyze content using OpenAI API.
        
        Args:
            content: Content to analyze
            user_preferences: User preferences to consider
            
        Returns:
            Tuple of (category scores, detailed analysis)
        """
        # Create system prompt with instructions
        system_prompt = self._create_moderation_prompt(user_preferences)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.1,  # Low temperature for more consistent evaluation
                max_tokens=1000,
                n=1,
                response_format={"type": "json_object"}
            )
            
            # Extract and parse the JSON response
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            # Extract scores and details
            scores = result.get("category_scores", {})
            details = result.get("details", {})
            
            return scores, details
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    def _create_moderation_prompt(self, user_preferences: Optional[Dict[str, Any]]) -> str:
        """Create a system prompt based on user preferences"""
        
        base_prompt = f"""
        You are an advanced content moderation AI. Analyze the following content and provide moderation scores 
        across these categories: {', '.join(self.categories)}.
        
        For each category, assign a score from 0.0 (completely safe) to 1.0 (clearly violates policy).
        
        Include detailed reasoning for any score above 0.3, including specific phrases or elements that triggered concerns.
        
        Return your analysis in the following JSON format:
        {{
            "category_scores": {{
                "hate": 0.0,
                "harassment": 0.0,
                "sexual": 0.0,
                "self-harm": 0.0,
                "violence": 0.0,
                "graphic": 0.0,
                "illegal-activity": 0.0,
                "misinformation": 0.0
            }},
            "details": {{
                "flagged_phrases": ["phrase 1", "phrase 2"],
                "contexts": {{"target_groups": [], "topics": []}},
                "reasoning": {{"category": "explanation"}}
            }}
        }}
        """
        
        # Add user preference context if available
        if user_preferences:
            pref_context = "Consider these user-specific moderation preferences:\n"
            
            # Add sensitivity level context
            if 'sensitivity' in user_preferences:
                pref_context += f"- Overall sensitivity level: {user_preferences['sensitivity']}\n"
            
            # Add category-specific preferences
            if 'category_preferences' in user_preferences:
                pref_context += "- Category preferences:\n"
                for cat, pref in user_preferences['category_preferences'].items():
                    pref_context += f"  - {cat}: {pref}\n"
            
            # Add custom rules if specified
            if 'custom_rules' in user_preferences:
                pref_context += "- Custom rules:\n"
                for rule in user_preferences['custom_rules']:
                    pref_context += f"  - {rule}\n"
            
            base_prompt = pref_context + "\n" + base_prompt
        
        return base_prompt
    
    def _process_moderation_results(self, 
                                   scores: Dict[str, float], 
                                   details: Dict[str, Any],
                                   sensitivity: float,
                                   category_thresholds: Dict[str, float],
                                   category_weights: Dict[str, float]) -> Dict[str, Any]:
        """
        Process raw moderation scores into actionable results based on user preferences.
        
        Args:
            scores: Category scores from OpenAI
            details: Additional analysis details
            sensitivity: Overall sensitivity threshold
            category_thresholds: Category-specific thresholds
            category_weights: Category importance weights
            
        Returns:
            Dict with processed moderation results
        """
        # Initialize results
        is_flagged = False
        flagged_categories = []
        explanations = []
        
        # Check each category against thresholds
        for category, score in scores.items():
            # Get category-specific threshold or use default
            threshold = category_thresholds.get(category, sensitivity)
            
            # Flag if score exceeds threshold
            if score >= threshold:
                is_flagged = True
                flagged_categories.append(category)
                
                # Generate explanation
                explanation = self._generate_explanation(category, score, details)
                explanations.append(explanation)
        
        return {
            "flagged": is_flagged,
            "flagged_categories": flagged_categories,
            "scores": scores,
            "explanations": explanations,
            "details": details
        }
    
    def _generate_explanation(self, category: str, score: float, details: Dict[str, Any]) -> str:
        """Generate human-readable explanation for flagged content"""
        
        template = settings.EXPLANATION_TEMPLATES.get(category, "This content was flagged in the {category} category.")
        
        # Extract relevant details for the explanation
        targets = []
        topics = []
        
        if "contexts" in details:
            contexts = details["contexts"]
            targets = contexts.get("target_groups", [])
            topics = contexts.get("topics", [])
        
        # Get category-specific reasoning if available
        reasoning = ""
        if "reasoning" in details and category in details["reasoning"]:
            reasoning = details["reasoning"][category]
        
        # Format the template with available details
        explanation = template.format(
            category=category,
            score=f"{score:.2f}",
            targets=", ".join(targets) if targets else "individuals",
            topics=", ".join(topics) if topics else "various topics"
        )
        
        # Add reasoning if available
        if reasoning:
            explanation += f" Specific concern: {reasoning}"
        
        return explanation


# Singleton instance for use throughout the application
moderation_engine = ModerationEngine()