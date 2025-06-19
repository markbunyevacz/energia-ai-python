"""
Main FastAPI application for Energia AI
Hungarian Legal AI System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime
import os
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from energia_ai.config.settings import get_settings
from energia_ai.core.logging import setup_logging

# Initialize settings and logging
settings = get_settings()
logger = setup_logging()

# Create FastAPI app
app = FastAPI(
    title="Energia AI - Hungarian Legal AI System",
    description="Advanced AI system for Hungarian legal document analysis and research",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0",
        "service": "energia-ai"
    })

@app.get("/ready")
async def readiness_check():
    """Readiness check with system info"""
    try:
        # Add basic system checks here
        return JSONResponse({
            "status": "ready",
            "timestamp": datetime.now().isoformat(),
            "version": "0.1.0",
            "service": "energia-ai",
            "environment": settings.environment,
            "database": "not_configured",  # Will be updated when DB is added
            "cache": "not_configured"       # Will be updated when Redis is added
        })
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Energia AI - Hungarian Legal AI System",
        "version": "0.1.0",
        "docs": "/api/docs",
        "health": "/health"
    }

# Import API routers
from energia_ai.api.ai.endpoints import router as ai_router
from energia_ai.api.crawlers.endpoints import router as crawler_router
from energia_ai.api.search.endpoints import router as search_router

# Include API routers
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(crawler_router, prefix="/api/crawlers", tags=["Crawlers"])
app.include_router(search_router, prefix="/api/search", tags=["Search"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
