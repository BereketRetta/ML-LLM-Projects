from fastapi import APIRouter, Depends, HTTPException, Body, Query, Path
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional, List
import uuid

from app.services.moderation_engine import moderation_engine
from app.services.explanation_generator import explanation_generator
from app.models.pydantic_models import (
    ContentModerationRequest,
    ContentModerationResponse,
    FeedbackRequest,
    FeedbackResponse
)
from app.services.feedback_processor import feedback_processor

# This would be replaced with actual auth in a real app
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

# In-memory store for demo (would be replaced with database)
moderation_history = {}


@router.post("/moderate", response_model=ContentModerationResponse)
async def moderate_content(
    request: ContentModerationRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Moderate content based on user preferences.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # Get user preferences (simplified)
        user_preferences = None  # This would come from database
        
        # Generate unique ID for this moderation request
        content_id = str(uuid.uuid4())
        
        # Moderate content
        moderation_result = await moderation_engine.moderate_content(
            request.content, user_preferences
        )
        
        # Generate explanation
        explanation = await explanation_generator.generate_explanation(
            request.content, moderation_result, user_preferences
        )
        
        # Store result in history
        moderation_history[content_id] = {
            "user_id": user_id,
            "content": request.content,
            "result": moderation_result,
            "explanation": explanation,
            "timestamp": "now()"  # This would be a real timestamp in production
        }
        
        # Return response
        return ContentModerationResponse(
            content_id=content_id,
            flagged=moderation_result.get("flagged", False),
            flagged_categories=moderation_result.get("flagged_categories", []),
            scores=moderation_result.get("scores", {}),
            explanation=explanation,
            details=moderation_result.get("details", {})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Moderation error: {str(e)}")


@router.post("/moderate/{content_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    content_id: str = Path(..., description="ID of the moderated content"),
    feedback: FeedbackRequest = Body(...),
    token: str = Depends(oauth2_scheme)
):
    """
    Submit feedback for a moderation decision.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # Check if content exists
        if content_id not in moderation_history:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Get original content and result
        moderation_data = moderation_history[content_id]
        content = moderation_data["content"]
        original_result = moderation_data["result"]
        
        # Process feedback
        result = await feedback_processor.process_feedback(
            user_id, content_id, content, original_result, feedback.dict()
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return FeedbackResponse(
            content_id=content_id,
            status="success",
            message="Feedback submitted successfully",
            updated_preferences=result.get("updated_preferences")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_moderation_history(
    token: str = Depends(oauth2_scheme),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get moderation history for the current user.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # Filter history by user (simplified)
        user_history = [
            {
                "content_id": content_id,
                "content": data["content"][:100] + "..." if len(data["content"]) > 100 else data["content"],
                "flagged": data["result"].get("flagged", False),
                "flagged_categories": data["result"].get("flagged_categories", []),
                "timestamp": data["timestamp"]
            }
            for content_id, data in moderation_history.items()
            if data["user_id"] == user_id
        ]
        
        # Sort by timestamp (would be real sorting in production)
        # Return limited number of items
        return user_history[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")