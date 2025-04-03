from pydantic import BaseModel, Field, validator, root_validator
from typing import Dict, List, Any, Optional
from app.core.config import get_settings

settings = get_settings()


class ContentModerationRequest(BaseModel):
    """Request model for content moderation"""
    content: str = Field(..., min_length=1, max_length=10000, description="Content to moderate")
    content_type: str = Field("text", description="Type of content (text, image, etc.)")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for moderation")
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = ["text", "image", "audio", "video"]
        if v not in allowed_types:
            raise ValueError(f"content_type must be one of: {', '.join(allowed_types)}")
        return v


class ContentModerationResponse(BaseModel):
    """Response model for content moderation"""
    content_id: str = Field(..., description="Unique identifier for this moderation")
    flagged: bool = Field(..., description="Whether the content was flagged")
    flagged_categories: List[str] = Field([], description="Categories that were flagged")
    scores: Dict[str, float] = Field({}, description="Category scores")
    explanation: str = Field("", description="Human-readable explanation")
    details: Dict[str, Any] = Field({}, description="Additional moderation details")


class FeedbackRequest(BaseModel):
    """Request model for moderation feedback"""
    should_flag: Optional[bool] = Field(None, description="Whether the content should be flagged")
    categories: Optional[Dict[str, bool]] = Field(None, description="Category-specific feedback")
    comment: Optional[str] = Field(None, max_length=1000, description="Additional feedback comments")
    
    @root_validator
    def validate_feedback(cls, values):
        """Ensure at least one feedback field is provided"""
        if all(v is None for v in values.values()):
            raise ValueError("At least one of should_flag, categories, or comment must be provided")
        
        # Validate categories if provided
        categories = values.get("categories")
        if categories:
            for category in categories:
                if category not in settings.MODERATION_CATEGORIES:
                    raise ValueError(f"Invalid category: {category}")
        
        return values


class FeedbackResponse(BaseModel):
    """Response model for moderation feedback"""
    content_id: str = Field(..., description="Content ID")
    status: str = Field(..., description="Status of the feedback submission")
    message: str = Field(..., description="Status message")
    updated_preferences: Optional[Dict[str, Any]] = Field(None, description="Updated user preferences")


class UserPreferencesModel(BaseModel):
    """Model for user moderation preferences"""
    sensitivity: Optional[float] = Field(None, ge=0.0, le=1.0, description="Overall sensitivity level")
    category_thresholds: Optional[Dict[str, float]] = Field(None, description="Category-specific thresholds")
    category_weights: Optional[Dict[str, float]] = Field(None, description="Category importance weights")
    custom_rules: Optional[List[str]] = Field(None, description="Custom moderation rules")
    
    @validator('category_thresholds')
    def validate_category_thresholds(cls, v):
        if v is not None:
            for category, threshold in v.items():
                if category not in settings.MODERATION_CATEGORIES:
                    raise ValueError(f"Invalid category: {category}")
                if threshold < 0.0 or threshold > 1.0:
                    raise ValueError(f"Threshold for {category} must be between 0.0 and 1.0")
        return v
    
    @validator('category_weights')
    def validate_category_weights(cls, v):
        if v is not None:
            for category, weight in v.items():
                if category not in settings.MODERATION_CATEGORIES:
                    raise ValueError(f"Invalid category: {category}")
                if weight < 0.0:
                    raise ValueError(f"Weight for {category} must be non-negative")
        return v


class UserPreferencesResponse(BaseModel):
    """Response model for user preferences"""
    user_id: str = Field(..., description="User ID")
    preferences: UserPreferencesModel = Field(..., description="User preferences")
    version: int = Field(1, description="Preferences version")