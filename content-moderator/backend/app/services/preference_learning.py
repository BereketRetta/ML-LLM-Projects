from typing import Dict, List, Any, Optional
import numpy as np
import logging
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class PreferenceLearningSystem:
    """
    System to learn and adapt content moderation preferences based on user feedback.
    """
    
    def __init__(self):
        """Initialize the preference learning system"""
        self.categories = settings.MODERATION_CATEGORIES
        self.default_sensitivity = settings.DEFAULT_SENSITIVITY
    
    async def create_user_profile(self, user_id: str, initial_preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a new user preference profile.
        
        Args:
            user_id: Unique identifier for the user
            initial_preferences: Optional initial preferences
            
        Returns:
            New user preference profile
        """
        # Create default profile
        default_profile = {
            "user_id": user_id,
            "sensitivity": self.default_sensitivity,
            "category_thresholds": {category: self.default_sensitivity for category in self.categories},
            "category_weights": {category: 1.0 for category in self.categories},
            "custom_rules": [],
            "examples": {
                "flagged": [],    # Examples of content that should be flagged
                "approved": []    # Examples of content that should be approved
            },
            "version": 1
        }
        
        # Override with initial preferences if provided
        if initial_preferences:
            self._merge_preferences(default_profile, initial_preferences)
        
        # TODO: Store in database
        
        return default_profile
    
    async def update_preferences(self, 
                               user_id: str, 
                               preference_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user preferences with new settings.
        
        Args:
            user_id: User identifier
            preference_updates: New preference settings
            
        Returns:
            Updated user preferences
        """
        # TODO: Retrieve current preferences from database
        current_preferences = await self._get_user_preferences(user_id)
        
        if not current_preferences:
            # Create new profile if it doesn't exist
            return await self.create_user_profile(user_id, preference_updates)
        
        # Update preferences
        self._merge_preferences(current_preferences, preference_updates)
        
        # Increment version
        current_preferences["version"] += 1
        
        # TODO: Save updated preferences to database
        
        return current_preferences
    
    async def process_feedback(self, 
                             user_id: str, 
                             content: str, 
                             moderation_result: Dict[str, Any],
                             user_feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process user feedback to improve preference model.
        
        Args:
            user_id: User identifier
            content: The content that was moderated
            moderation_result: Original moderation result
            user_feedback: User feedback on the moderation
            
        Returns:
            Updated user preferences
        """
        # Get current preferences
        preferences = await self._get_user_preferences(user_id)
        
        if not preferences:
            preferences = await self.create_user_profile(user_id)
        
        # Extract feedback details
        should_flag = user_feedback.get("should_flag", None)
        feedback_categories = user_feedback.get("categories", {})
        feedback_comment = user_feedback.get("comment", "")
        
        # Update examples based on feedback
        if should_flag is not None:
            example = {
                "content": content,
                "original_result": moderation_result,
                "feedback": user_feedback
            }
            
            if should_flag:
                preferences["examples"]["flagged"].append(example)
            else:
                preferences["examples"]["approved"].append(example)
        
        # Adjust category thresholds based on feedback
        if feedback_categories and moderation_result.get("scores"):
            scores = moderation_result["scores"]
            
            for category, should_flag_category in feedback_categories.items():
                if category in scores:
                    # Get current threshold
                    current_threshold = preferences["category_thresholds"].get(category, self.default_sensitivity)
                    score = scores[category]
                    
                    # Adjust threshold based on feedback
                    new_threshold = self._adjust_threshold(
                        current_threshold, score, should_flag_category
                    )
                    
                    # Update threshold
                    preferences["category_thresholds"][category] = new_threshold
        
        # Increment version
        preferences["version"] += 1
        
        # TODO: Save updated preferences to database
        
        return preferences
    
    async def _get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve user preferences from storage.
        
        Args:
            user_id: User identifier
            
        Returns:
            User preference profile or None if not found
        """
        # TODO: Implement database retrieval
        # For now, return None to simulate new user
        return None
    
    def _merge_preferences(self, base_preferences: Dict[str, Any], updates: Dict[str, Any]) -> None:
        """
        Merge updates into base preferences.
        
        Args:
            base_preferences: Original preferences to update
            updates: New preferences to apply
        """
        for key, value in updates.items():
            if key in base_preferences:
                if isinstance(value, dict) and isinstance(base_preferences[key], dict):
                    # Recursively update nested dictionaries
                    self._merge_preferences(base_preferences[key], value)
                else:
                    # Replace value
                    base_preferences[key] = value
            else:
                # Add new key
                base_preferences[key] = value
    
    def _adjust_threshold(self, current_threshold: float, score: float, should_flag: bool) -> float:
        """
        Adjust threshold based on feedback.
        
        Args:
            current_threshold: Current threshold value
            score: Content score
            should_flag: Whether content should be flagged
            
        Returns:
            New threshold value
        """
        # Learning rate
        alpha = 0.1
        
        if should_flag and score < current_threshold:
            # Content should be flagged but wasn't - lower threshold
            new_threshold = current_threshold - alpha * (current_threshold - score)
        elif not should_flag and score >= current_threshold:
            # Content was flagged but shouldn't be - raise threshold
            new_threshold = current_threshold + alpha * (score - current_threshold)
        else:
            # Correct decision, no change needed
            new_threshold = current_threshold
        
        # Ensure threshold stays within valid range [0.1, 0.9]
        return max(0.1, min(0.9, new_threshold))


# Singleton instance
preference_learning_system = PreferenceLearningSystem()