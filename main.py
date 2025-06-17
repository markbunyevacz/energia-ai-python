#!/usr/bin/env python3
"""
Entry point for Energia AI FastAPI application
"""

import sys
from pathlib import Path

# Add src to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from src.energia_ai.main import app

if __name__ == "__main__":
    import uvicorn
    from src.energia_ai.config.settings import get_settings
    
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
