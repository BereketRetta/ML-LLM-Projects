from typing import Dict, List, Any, Optional
import openai
import logging
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class ExplanationGenerator:
    """
    Generates human-readable explanations for moderation decisions.
    """
    
    def __init__(self, model: str = settings.OPENAI_MODEL):
        """
        Initialize the explanation generator.
        
        Args:
            model: OpenAI model to use for generating explanations
        """
        self.model = model
        self.templates = settings.EXPLANATION_TEMPLATES
    
    async def generate_explanation(self, 
                                 content: str, 
                                 moderation_result: Dict[str, Any],
                                 user_preferences: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate detailed explanation for moderation decision.
        
        Args:
            content: Original content that was moderated
            moderation_result: Results from the moderation engine
            user_preferences: User preferences for context
            
        Returns:
            Human-readable explanation
        """
        # For simple cases, use template-based explanation
        if not moderation_result.get("flagged"):
            return "This content has been reviewed and meets the community standards."
        
        # If we already have explanations from the moderation engine, use those
        if "explanations" in moderation_result and moderation_result["explanations"]:
            return "\n".join(moderation_result["explanations"])
        
        # For more complex cases, generate explanation with OpenAI
        try:
            return await self._generate_detailed_explanation(content, moderation_result, user_preferences)
        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}")
            # Fall back to simple explanation
            return self._generate_basic_explanation(moderation_result)
    
    async def _generate_detailed_explanation(self, 
                                           content: str, 
                                           moderation_result: Dict[str, Any],
                                           user_preferences: Optional[Dict[str, Any]]) -> str:
        """
        Generate detailed explanation using OpenAI.
        
        Args:
            content: Original content
            moderation_result: Moderation results
            user_preferences: User preferences
            
        Returns:
            Detailed explanation
        """
        # Extract relevant information
        flagged_categories = moderation_result.get("flagged_categories", [])
        scores = moderation_result.get("scores", {})
        details = moderation_result.get("details", {})
        
        # Create prompt for explanation generation
        system_prompt = """
        You are an AI content moderation assistant that provides clear, helpful explanations about why 
        content has been flagged. Your goal is to be informative without being judgmental.
        
        Provide a concise explanation of why the content was flagged, focusing on:
        1. The specific categories of concern
        2. Brief mentions of problematic elements
        3. Educational context when appropriate
        
        Your explanation should be clear, concise, and helpful to the user.
        """
        
        # Build explanation context
        context = f"""
        Content was flagged in the following categories: {', '.join(flagged_categories)}
        
        Category scores:
        {self._format_scores(scores)}
        
        Detailed analysis:
        {self._format_details(details)}
        """
        
        # Add user preferences context if available
        if user_preferences:
            context += f"""
            User sensitivity level: {user_preferences.get('sensitivity', settings.DEFAULT_SENSITIVITY)}
            """
        
        # Generate explanation with OpenAI
        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Content: {content}\n\n{context}"}
            ],
            temperature=0.7,
            max_tokens=250
        )
        
        return response.choices[0].message.content.strip()
    
    def _generate_basic_explanation(self, moderation_result: Dict[str, Any]) -> str:
        """
        Generate a basic explanation from templates.
        
        Args:
            moderation_result: Moderation results
            
        Returns:
            Basic explanation
        """
        flagged_categories = moderation_result.get("flagged_categories", [])
        
        if not flagged_categories:
            return "This content has been flagged by our moderation system."
        
        explanations = []
        for category in flagged_categories:
            template = self.templates.get(category, "This content was flagged in the {category} category.")
            explanation = template.format(category=category, targets="individuals", topics="various topics")
            explanations.append(explanation)
        
        return "\n".join(explanations)
    
    def _format_scores(self, scores: Dict[str, float]) -> str:
        """Format category scores for explanation context"""
        return "\n".join([f"- {category}: {score:.2f}" for category, score in scores.items()])
    
    def _format_details(self, details: Dict[str, Any]) -> str:
        """Format analysis details for explanation context"""
        result = []
        
        # Add flagged phrases
        if "flagged_phrases" in details and details["flagged_phrases"]:
            phrases = details["flagged_phrases"]
            result.append(f"Flagged phrases: {', '.join(phrases)}")
        
        # Add contexts
        if "contexts" in details:
            contexts = details["contexts"]
            
            if "target_groups" in contexts and contexts["target_groups"]:
                result.append(f"Target groups: {', '.join(contexts['target_groups'])}")
                
            if "topics" in contexts and contexts["topics"]:
                result.append(f"Topics: {', '.join(contexts['topics'])}")
        
        # Add reasoning
        if "reasoning" in details:
            reasoning = details["reasoning"]
            result.append("Reasoning:")
            for category, explanation in reasoning.items():
                result.append(f"- {category}: {explanation}")
        
        return "\n".join(result)


# Singleton instance
explanation_generator = ExplanationGenerator()