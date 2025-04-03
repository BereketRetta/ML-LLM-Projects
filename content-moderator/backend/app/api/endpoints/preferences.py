from fastapi import APIRouter, Depends, HTTPException, Body, Path
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any

from app.services.preference_learning import preference_learning_system
from app.models.pydantic_models import UserPreferencesModel, UserPreferencesResponse

# This would be replaced with actual auth in a real app
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    token: str = Depends(oauth2_scheme)
):
    """
    Get current user preferences.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # Get user preferences
        preferences = await preference_learning_system._get_user_preferences(user_id)
        
        if not preferences:
            # Create default preferences if none exist
            preferences = await preference_learning_system.create_user_profile(user_id)
        
        # Return response
        return UserPreferencesResponse(
            user_id=user_id,
            preferences=UserPreferencesModel(
                sensitivity=preferences.get("sensitivity"),
                category_thresholds=preferences.get("category_thresholds"),
                category_weights=preferences.get("category_weights"),
                custom_rules=preferences.get("custom_rules")
            ),
            version=preferences.get("version", 1)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving preferences: {str(e)}")


@router.post("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences: UserPreferencesModel = Body(...),
    token: str = Depends(oauth2_scheme)
):
    """
    Update user preferences.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # Update preferences
        updated_preferences = await preference_learning_system.update_preferences(
            user_id, preferences.dict(exclude_unset=True)
        )
        
        # Return response
        return UserPreferencesResponse(
            user_id=user_id,
            preferences=UserPreferencesModel(
                sensitivity=updated_preferences.get("sensitivity"),
                category_thresholds=updated_preferences.get("category_thresholds"),
                category_weights=updated_preferences.get("category_weights"),
                custom_rules=updated_preferences.get("custom_rules")
            ),
            version=updated_preferences.get("version", 1)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")


@router.post("/preferences/reset", response_model=UserPreferencesResponse)
async def reset_user_preferences(
    token: str = Depends(oauth2_scheme)
):
    """
    Reset user preferences to default.
    """
    try:
        # Extract user ID from token (simplified)
        user_id = "user-123"  # This would come from token validation
        
        # Create default preferences
        default_preferences = await preference_learning_system.create_user_profile(user_id)
        
        # Return response
        return UserPreferencesResponse(
            user_id=user_id,
            preferences=UserPreferencesModel(
                sensitivity=default_preferences.get("sensitivity"),
                category_thresholds=default_preferences.get("category_thresholds"),
                category_weights=default_preferences.get("category_weights"),
                custom_rules=default_preferences.get("custom_rules")
            ),
            version=default_preferences.get("version", 1)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting preferences: {str(e)}")