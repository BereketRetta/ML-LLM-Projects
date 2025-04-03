from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
import time
import logging
from typing import Dict, Any

from app.core.config import get_settings
from app.api.router import api_router

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Add middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the AI Content Moderator API",
        "version": "1.0.0",
        "documentation": f"/docs",
    }


# Simplified auth for demo purposes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # In a real app, this would validate credentials against a database
    # For demo, we accept any username/password
    if not form_data.username or not form_data.password:
        return JSONResponse(
            status_code=401, 
            content={"detail": "Incorrect username or password"}
        )
    
    # Generate a mock token (in production, use proper JWT)
    token = f"mock_token_{form_data.username}"
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "api_version": "v1",
        "services": {
            "moderation_engine": "operational",
            "preference_learning": "operational",
            "explanation_generator": "operational"
        }
    }


# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="AI Content Moderator API with personalized preferences and explainable decisions.",
        routes=app.routes,
    )
    
    # Add more metadata
    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)