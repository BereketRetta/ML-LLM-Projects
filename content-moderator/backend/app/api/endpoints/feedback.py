from fastapi import APIRouter, Depends, HTTPException, Body, Path, Query
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, List, Any, Optional

from app.services.feedback_processor import feedback_processor
from app.models.pydantic_models import FeedbackRequest, FeedbackResponse

# This would be replaced with actual auth in a real app
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()


@router.post("/submit", response_model=FeedbackResponse)
async def submit_feedback(
    content_id: str = Query(..., description="ID of the moderated content"),
    feedback: FeedbackRequest = Body(...),
    token: str = Depends(oauth2_scheme)
):
    """
    Submit feedback for a moderation decision.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # This endpoint is just a duplicate of the one in moderation.py
        # In a real app, we would redirect to that endpoint or refactor
        # For now, we'll just error out to avoid duplicating logic
        raise HTTPException(
            status_code=307, 
            detail="This endpoint has moved",
            headers={"Location": f"/api/v1/moderation/moderate/{content_id}/feedback"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")


@router.get("/stats", response_model=Dict[str, Any])
async def get_feedback_stats(
    token: str = Depends(oauth2_scheme)
):
    """
    Get statistics about user feedback.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # In a real app, we would query the database for stats
        # For now, return mock data
        return {
            "total_feedback_count": 42,
            "agreement_rate": 0.85,
            "disagreement_categories": {
                "hate": 0.4,
                "harassment": 0.3,
                "misinformation": 0.2,
                "other": 0.1
            },
            "feedback_impact": {
                "threshold_changes": {
                    "hate": -0.05,
                    "harassment": +0.02,
                    "sexual": -0.01
                },
                "accuracy_improvement": 0.12
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving feedback stats: {str(e)}")