from typing import Dict, List, Any, Optional
import logging
from app.core.config import get_settings
from app.services.preference_learning import preference_learning_system

settings = get_settings()
logger = logging.getLogger(__name__)

class FeedbackProcessor:
    """
    Processes user feedback on moderation decisions and updates user preferences.
    """
    
    def __init__(self):
        """Initialize the feedback processor"""
        self.categories = settings.MODERATION_CATEGORIES
    
    async def process_feedback(self, 
                             user_id: str,
                             content_id: str,
                             content: str,
                             original_result: Dict[str, Any],
                             feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process user feedback and update preferences.
        
        Args:
            user_id: User identifier
            content_id: Identifier for the moderated content
            content: The content that was moderated
            original_result: Original moderation result
            feedback: User feedback
            
        Returns:
            Updated user preferences
        """
        try:
            # Validate feedback
            validated_feedback = self._validate_feedback(feedback)
            
            # Log feedback for analytics
            await self._log_feedback(user_id, content_id, validated_feedback)
            
            # Update user preferences based on feedback
            updated_preferences = await preference_learning_system.process_feedback(
                user_id, content, original_result, validated_feedback
            )
            
            # Return updated preferences
            return {
                "status": "success",
                "message": "Feedback processed successfully",
                "updated_preferences": updated_preferences
            }
            
        except ValueError as e:
            logger.error(f"Feedback validation error: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
        except Exception as e:
            logger.error(f"Feedback processing error: {str(e)}")
            return {
                "status": "error",
                "message": "Error processing feedback"
            }
    
    def _validate_feedback(self, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate user feedback.
        
        Args:
            feedback: User feedback to validate
            
        Returns:
            Validated feedback
            
        Raises:
            ValueError: If feedback is invalid
        """
        validated = {}
        
        # Check if should_flag is provided
        if "should_flag" in feedback:
            should_flag = feedback["should_flag"]
            if not isinstance(should_flag, bool):
                raise ValueError("should_flag must be a boolean")
            validated["should_flag"] = should_flag
        
        # Check category feedback
        if "categories" in feedback:
            categories = feedback["categories"]
            if not isinstance(categories, dict):
                raise ValueError("categories must be a dictionary")
                
            validated_categories = {}
            for category, should_flag in categories.items():
                if category not in self.categories:
                    raise ValueError(f"Invalid category: {category}")
                if not isinstance(should_flag, bool):
                    raise ValueError(f"Category flag for {category} must be a boolean")
                validated_categories[category] = should_flag
                
            validated["categories"] = validated_categories
        
        # Check comment
        if "comment" in feedback:
            comment = feedback["comment"]
            if not isinstance(comment, str):
                raise ValueError("comment must be a string")
            validated["comment"] = comment
        
        # Check if feedback is empty
        if not validated:
            raise ValueError("Feedback must contain at least one of: should_flag, categories, comment")
        
        return validated
    
    async def _log_feedback(self, user_id: str, content_id: str, feedback: Dict[str, Any]) -> None:
        """
        Log feedback for analytics.
        
        Args:
            user_id: User identifier
            content_id: Content identifier
            feedback: Validated feedback
        """
        # TODO: Implement feedback logging to database
        feedback_log = {
            "user_id": user_id,
            "content_id": content_id,
            "feedback": feedback,
            "timestamp": "now()"  # This would be replaced with actual timestamp in DB
        }
        
        logger.info(f"Feedback logged: {feedback_log}")


# Singleton instance
feedback_processor = FeedbackProcessor()