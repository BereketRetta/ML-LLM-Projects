from pydantic import BaseSettings, Field
from typing import Optional, List, Dict, Any
import os
from functools import lru_cache


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Content Moderator"
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # OpenAI
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4-turbo-preview"  # Default model
    
    # Vector DB (for storing preference examples)
    VECTOR_DB_URL: Optional[str] = Field(None, env="VECTOR_DB_URL")
    VECTOR_DB_API_KEY: Optional[str] = Field(None, env="VECTOR_DB_API_KEY")
    
    # Moderation Settings
    DEFAULT_SENSITIVITY: float = 0.7  # Default sensitivity threshold (0-1)
    MODERATION_CATEGORIES: List[str] = [
        "hate",
        "harassment",
        "sexual",
        "self-harm",
        "violence",
        "graphic",
        "illegal-activity",
        "misinformation"
    ]
    
    # Explanation Templates
    EXPLANATION_TEMPLATES: Dict[str, str] = {
        "hate": "This content was flagged for potentially containing hateful language or promoting discrimination against {targets}.",
        "harassment": "This content was flagged for potentially containing harassment or bullying directed at {targets}.",
        "sexual": "This content was flagged for potentially containing sexually explicit material.",
        "self-harm": "This content was flagged for potentially promoting or glorifying self-harm.",
        "violence": "This content was flagged for potentially containing violent content or promoting violence against {targets}.",
        "graphic": "This content was flagged for potentially containing graphic descriptions or imagery.",
        "illegal-activity": "This content was flagged for potentially describing or promoting illegal activities.",
        "misinformation": "This content was flagged for potentially containing misinformation about {topics}."
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()