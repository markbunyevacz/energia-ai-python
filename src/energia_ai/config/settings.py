"""
Application settings using Pydantic
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    environment: str = "development"
    
    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Database settings (will be used later)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/energia_ai"
    mongodb_url: str = "mongodb://localhost:27017"
    redis_url: str = "redis://localhost:6379/0"
    
    # Qdrant vector database settings
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    
    # Elasticsearch settings
    elasticsearch_host: str = "localhost"
    elasticsearch_port: int = 9200
    
    # API settings
    api_key: str = ""
    claude_api_key: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
_settings = None

def get_settings() -> Settings:
    """Get settings singleton"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
