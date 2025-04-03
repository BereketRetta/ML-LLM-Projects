from fastapi import APIRouter
from app.api.endpoints import moderation, preferences, feedback

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])
api_router.include_router(preferences.router, prefix="/users", tags=["users"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])