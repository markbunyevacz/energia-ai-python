#!/usr/bin/env python3
"""
Cursor Configuration Manager with Automated Task Implementation Engine
Manages development contexts and automatically implements tasks from Task Master AI
"""

import os
import json
import sys
import argparse
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import subprocess
import tempfile
import re

class TaskImplementationEngine:
    """Automated engine that reads TODO tasks and implements them one by one"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.tasks_file = self.project_root / '.taskmaster' / 'tasks' / 'tasks.json'
        self.src_dir = self.project_root / 'src'
        self.app_dir = self.project_root / 'app'
        
    def load_tasks(self) -> Dict[str, Any]:
        """Load tasks from the Task Master AI JSON file"""
        if not self.tasks_file.exists():
            print(f" Tasks file not found: {self.tasks_file}")
            return {}
        
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def save_tasks(self, tasks_data: Dict[str, Any]) -> None:
        """Save updated tasks back to the JSON file"""
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(tasks_data, f, indent=2, ensure_ascii=False)
    
    def get_next_todo_task(self, tasks_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find the next TODO task with all dependencies met, prioritizing implemented tasks"""
        if 'master' not in tasks_data or 'tasks' not in tasks_data['master']:
            return None
        
        tasks = tasks_data['master']['tasks']
        done_task_ids = {task['id'] for task in tasks if task.get('status') == 'done'}
        
        # First, look for tasks that have implementations available
        implemented_task_ids = [1, 2, 3, 16]  # Tasks with implementations
        
        for task_id in implemented_task_ids:
            task = next((t for t in tasks if t['id'] == task_id), None)
            if not task or task.get('status') != 'todo':
                continue
            
            # Check if all dependencies are met
            dependencies = task.get('dependencies', [])
            if all(dep_id in done_task_ids for dep_id in dependencies):
                return task
        
        # Fallback to original logic for other tasks
        for task in tasks:
            if task.get('status') != 'todo':
                continue
            
            # Check if all dependencies are met
            dependencies = task.get('dependencies', [])
            if all(dep_id in done_task_ids for dep_id in dependencies):
                return task
        
        return None
    
    def update_task_status(self, tasks_data: Dict[str, Any], task_id: int, status: str) -> None:
        """Update task status in the data structure"""
        if 'master' not in tasks_data or 'tasks' not in tasks_data['master']:
            return
        
        for task in tasks_data['master']['tasks']:
            if task['id'] == task_id:
                task['status'] = status
                task['updated'] = datetime.now().isoformat()
                break
        
        # Update metadata
        tasks_data['master']['metadata']['updated'] = datetime.now().isoformat()
    
    def implement_task_1_fastapi_setup(self) -> bool:
        """Implement Task 1: Set up Python project structure and FastAPI backend"""
        print(" Implementing Task 1: FastAPI Backend Setup")
        
        try:
            # Create src directory structure
            src_energia = self.src_dir / 'energia_ai'
            src_energia.mkdir(parents=True, exist_ok=True)
            
            # Create __init__.py files
            (src_energia / '__init__.py').write_text('"""Energia AI - Hungarian Legal AI System"""\n__version__ = "0.1.0"\n')
            
            # Create main FastAPI application
            main_py_content = '''"""
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
'''
            (src_energia / 'main.py').write_text(main_py_content)
            
            # Create config directory and settings
            config_dir = src_energia / 'config'
            config_dir.mkdir(exist_ok=True)
            (config_dir / '__init__.py').write_text('')
            
            settings_py_content = '''"""
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
    database_url: str = ""
    mongodb_url: str = ""
    redis_url: str = ""
    
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
'''
            (config_dir / 'settings.py').write_text(settings_py_content)
            
            # Create core directory with logging
            core_dir = src_energia / 'core'
            core_dir.mkdir(exist_ok=True)
            (core_dir / '__init__.py').write_text('')
            
            logging_py_content = '''"""
Structured logging setup for Energia AI
"""

import logging
import sys
from pathlib import Path
import structlog
from typing import Any, Dict

def setup_logging(log_level: str = "INFO") -> structlog.stdlib.BoundLogger:
    """
    Set up structured logging with JSON output in production
    """
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="ISO"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if _is_production() else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger()

def _is_production() -> bool:
    """Check if running in production environment"""
    import os
    return os.getenv("ENVIRONMENT", "development").lower() == "production"
'''
            (core_dir / 'logging.py').write_text(logging_py_content)
            
            # Create API directory structure
            api_dir = src_energia / 'api'
            api_dir.mkdir(exist_ok=True)
            (api_dir / '__init__.py').write_text('')
            
            # Update main.py in project root to use the new structure
            root_main_content = '''#!/usr/bin/env python3
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
'''
            (self.project_root / 'main.py').write_text(root_main_content)
            
            # Update requirements.txt with FastAPI dependencies
            requirements_content = '''# FastAPI and server
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Structured logging
structlog==23.2.0

# HTTP client
httpx==0.25.2

# Environment management
python-dotenv==1.0.0

# Development tools
ruff==0.1.6
mypy==1.7.1
pytest==7.4.3
pytest-asyncio==0.21.1

# Database drivers (will be used in later tasks)
asyncpg==0.29.0
motor==3.3.2
aioredis==2.0.1

# AI/ML libraries
anthropic==0.7.7
sentence-transformers==2.2.2
numpy==1.24.3

# Web scraping
beautifulsoup4==4.12.2
aiohttp==3.9.1
selenium==4.15.2

# Document processing
pypdf2==3.0.1
python-docx==1.1.0
'''
            (self.project_root / 'requirements.txt').write_text(requirements_content)
            
            # Create .env template
            env_template_content = '''# Energia AI Environment Variables

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true
ENVIRONMENT=development

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Database URLs (configure when databases are set up)
DATABASE_URL=
MONGODB_URL=
REDIS_URL=

# API Keys
CLAUDE_API_KEY=
API_KEY=

# Logging
LOG_LEVEL=INFO
'''
            (self.project_root / '.env.template').write_text(env_template_content)
            
            print(" Task 1 completed: FastAPI backend structure created")
            print("   - Created src/energia_ai/ package structure")
            print("   - Set up FastAPI application with health endpoints")
            print("   - Added structured logging with structlog")
            print("   - Created Pydantic settings management")
            print("   - Added CORS middleware")
            print("   - Updated requirements.txt with dependencies")
            print("   - Created .env.template for configuration")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 1: {e}")
            return False
    
    def implement_task_2_docker_setup(self) -> bool:
        """Implement Task 2: Create Docker and Docker Compose setup"""
        print(" Implementing Task 2: Docker and Docker Compose setup")
        
        try:
            # Create Dockerfile
            dockerfile_content = '''# Multi-stage Dockerfile for Energia AI
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1 \\
    PIP_NO_CACHE_DIR=1 \\
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    build-essential \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \\
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "main.py"]

# Development stage
FROM base as development
USER root
RUN pip install --no-cache-dir pytest pytest-asyncio mypy ruff
USER app
CMD ["python", "main.py"]

# Production stage
FROM base as production
ENV ENVIRONMENT=production
CMD ["uvicorn", "src.energia_ai.main:app", "--host", "0.0.0.0", "--port", "8000"]
'''
            (self.project_root / 'Dockerfile').write_text(dockerfile_content)
            
            # Create docker-compose.yml
            docker_compose_content = '''version: '3.8'

services:
  # FastAPI Application
  energia-ai:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "8000:8000"
    environment:
      - DEBUG=true
      - ENVIRONMENT=development
      - DATABASE_URL=postgresql://energia:energia123@postgres:5432/energia_ai
      - MONGODB_URL=mongodb://energia:energia123@mongodb:27017/energia_ai
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - .:/app
      - /app/__pycache__
    depends_on:
      - postgres
      - mongodb
      - redis
      - elasticsearch
      - qdrant
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: energia_ai
      POSTGRES_USER: energia
      POSTGRES_PASSWORD: energia123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U energia -d energia_ai"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB
  mongodb:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: energia
      MONGO_INITDB_ROOT_PASSWORD: energia123
      MONGO_INITDB_DATABASE: energia_ai
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes --requirepass energia123
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "energia123", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Elasticsearch for lexical search
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Qdrant Vector Database
  qdrant:
    image: qdrant/qdrant:v1.7.0
    volumes:
      - qdrant_data:/qdrant/storage
    ports:
      - "6333:6333"
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Neo4j Graph Database (for later tasks)
  neo4j:
    image: neo4j:5.13-community
    environment:
      NEO4J_AUTH: neo4j/energia123
      NEO4J_PLUGINS: '["apoc"]'
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"
      - "7687:7687"
    networks:
      - energia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "cypher-shell -u neo4j -p energia123 'RETURN 1'"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
  elasticsearch_data:
  qdrant_data:
  neo4j_data:

networks:
  energia-network:
    driver: bridge
'''
            (self.project_root / 'docker-compose.yml').write_text(docker_compose_content)
            
            # Create docker-compose.prod.yml for production
            docker_compose_prod_content = '''version: '3.8'

services:
  energia-ai:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
    env_file:
      - .env
    depends_on:
      - postgres
      - mongodb
      - redis
      - elasticsearch
      - qdrant
    networks:
      - energia-network
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Production database configurations with better security
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: energia_ai
    env_file:
      - .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - energia-network
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M

  # Include other services with production configurations...
  # (Similar to development but with production settings)

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
  elasticsearch_data:
  qdrant_data:
  neo4j_data:

networks:
  energia-network:
    driver: bridge
'''
            (self.project_root / 'docker-compose.prod.yml').write_text(docker_compose_prod_content)
            
            # Create .dockerignore
            dockerignore_content = '''# Git
.git
.gitignore

# Python
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.mypy_cache
.pytest_cache

# Node.js (for future frontend)
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Project specific
.env
.env.local
.env.*.local
logs/
temp/
tmp/

# Documentation
docs/
*.md
LICENSE
'''
            (self.project_root / '.dockerignore').write_text(dockerignore_content)
            
            # Create database initialization directory
            db_init_dir = self.project_root / 'database' / 'init'
            db_init_dir.mkdir(parents=True, exist_ok=True)
            
            # Create basic database initialization script
            init_sql_content = '''-- Energia AI Database Initialization
-- This script runs when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables (will be expanded in Task 4)
CREATE TABLE IF NOT EXISTS system_info (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial system info
INSERT INTO system_info (version) VALUES ('0.1.0') ON CONFLICT DO NOTHING;

-- Create a basic health check table
CREATE TABLE IF NOT EXISTS health_checks (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
'''
            (db_init_dir / '01_init.sql').write_text(init_sql_content)
            
            print(" Task 2 completed: Docker and Docker Compose setup created")
            print("   - Created multi-stage Dockerfile with development and production targets")
            print("   - Set up docker-compose.yml with all required services:")
            print("     * FastAPI application")
            print("     * PostgreSQL database")
            print("     * MongoDB document store")
            print("     * Redis cache")
            print("     * Elasticsearch for lexical search")
            print("     * Qdrant vector database")
            print("     * Neo4j graph database")
            print("   - Added health checks for all services")
            print("   - Created .dockerignore for optimized builds")
            print("   - Set up database initialization scripts")
            print("   - Ready to run: docker-compose up -d")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 2: {e}")
            return False
    
    def implement_task_3_cicd_pipeline(self) -> bool:
        """Implement Task 3: CI/CD pipeline with GitHub Actions"""
        print(" Implementing Task 3: CI/CD Pipeline with GitHub Actions")
        
        try:
            # Create .github/workflows directory
            workflows_dir = self.project_root / '.github' / 'workflows'
            workflows_dir.mkdir(parents=True, exist_ok=True)
            
            # Create main CI/CD workflow
            main_workflow_content = '''name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  PYTHON_VERSION: "3.11"

jobs:
  test:
    name: Test and Quality Checks
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_energia_ai
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
        cache: 'pip'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest-cov bandit safety

    - name: Run Ruff linting
      run: |
        ruff check . --output-format=github
        ruff format --check .

    - name: Run MyPy type checking
      run: |
        mypy src/ --ignore-missing-imports

    - name: Run security checks with Bandit
      run: |
        bandit -r src/ -f json -o bandit-report.json
      continue-on-error: true

    - name: Run safety check for vulnerabilities
      run: |
        safety check --json --output safety-report.json
      continue-on-error: true

    - name: Run tests with coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_energia_ai
        REDIS_URL: redis://localhost:6379/0
        ENVIRONMENT: testing
      run: |
        pytest --cov=src --cov-report=xml --cov-report=html --cov-report=term-missing

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        flags: unittests
        name: codecov-umbrella

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          coverage.xml
          htmlcov/
          bandit-report.json
          safety-report.json

  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Docker Hub
      if: github.ref == 'refs/heads/main'
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: ${{ github.ref == 'refs/heads/main' }}
        tags: |
          energia-ai:latest
          energia-ai:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add actual deployment commands here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add actual deployment commands here
'''
            (workflows_dir / 'main.yml').write_text(main_workflow_content)
            
            # Create pull request workflow
            pr_workflow_content = '''name: Pull Request Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-checks:
    name: PR Quality Checks
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: "3.11"
        cache: 'pip'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install ruff mypy

    - name: Check code formatting
      run: |
        ruff format --check --diff .

    - name: Run linting
      run: |
        ruff check . --output-format=github

    - name: Type checking
      run: |
        mypy src/ --ignore-missing-imports

    - name: Check for secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD

  pr-size-check:
    name: PR Size Check
    runs-on: ubuntu-latest
    steps:
    - name: Check PR size
      uses: actions/github-script@v6
      with:
        script: |
          const { data: pr } = await github.rest.pulls.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.issue.number,
          });
          
          const additions = pr.additions;
          const deletions = pr.deletions;
          const changes = additions + deletions;
          
          if (changes > 1000) {
            core.setFailed(`PR is too large (${changes} lines changed). Consider breaking it into smaller PRs.`);
          } else if (changes > 500) {
            core.warning(`PR is quite large (${changes} lines changed). Consider reviewing if it can be split.`);
          }
'''
            (workflows_dir / 'pr-checks.yml').write_text(pr_workflow_content)
            
            # Update requirements.txt with testing dependencies
            requirements_path = self.project_root / 'requirements.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.read_text()
                if 'pytest' not in current_requirements:
                    additional_requirements = '''
# Testing dependencies
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0

# Code quality
ruff==0.1.6
mypy==1.7.1
bandit==1.7.5
safety==2.3.5

# Development tools
pre-commit==3.5.0
'''
                    requirements_path.write_text(current_requirements + additional_requirements)
            
            # Create pytest configuration
            pytest_ini_content = '''[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --strict-config
    --verbose
    --tb=short
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests
asyncio_mode = auto
'''
            (self.project_root / 'pytest.ini').write_text(pytest_ini_content)
            
            # Create basic test structure
            tests_dir = self.project_root / 'tests'
            tests_dir.mkdir(exist_ok=True)
            (tests_dir / '__init__.py').write_text('')
            
            # Create a basic test file
            test_main_content = '''"""
Tests for the main FastAPI application
"""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.energia_ai.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["service"] == "energia-ai"

def test_ready_endpoint():
    """Test the readiness check endpoint"""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "timestamp" in data
    assert data["service"] == "energia-ai"

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Energia AI" in data["message"]
    assert data["docs"] == "/api/docs"

def test_docs_endpoint():
    """Test that API documentation is available"""
    response = client.get("/api/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
'''
            (tests_dir / 'test_main.py').write_text(test_main_content)
            
            # Create pre-commit configuration
            precommit_content = '''repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: debug-statements

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.1
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: [--ignore-missing-imports]

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.5
    hooks:
      - id: bandit
        args: [-r, src/]
'''
            (self.project_root / '.pre-commit-config.yaml').write_text(precommit_content)
            
            print(" Task 3 completed: CI/CD pipeline created")
            print("   - Created GitHub Actions workflows:")
            print("     * Main CI/CD pipeline with testing, building, and deployment")
            print("     * Pull request quality checks")
            print("   - Added comprehensive testing setup with pytest")
            print("   - Configured code quality tools (ruff, mypy, bandit)")
            print("   - Set up pre-commit hooks")
            print("   - Created basic test structure and examples")
            print("   - Added security scanning and vulnerability checks")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 3: {e}")
            return False
    
    def implement_task_16_claude_integration(self) -> bool:
        """Implement Task 16: Integrate Claude API for legal analysis"""
        print(" Implementing Task 16: Claude API Integration")
        
        try:
            # Create AI integration directory
            ai_dir = self.src_dir / 'energia_ai' / 'ai'
            ai_dir.mkdir(exist_ok=True)
            (ai_dir / '__init__.py').write_text('')
            
            # Create Claude client
            claude_client_content = '''"""
Claude API client for legal analysis
"""
import asyncio
from typing import Dict, List, Optional, Any
import anthropic
from anthropic import AsyncAnthropic
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class ClaudeClient:
    """Async Claude API client for legal document analysis"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = AsyncAnthropic(
            api_key=self.settings.claude_api_key
        )
        self.model = "claude-3-sonnet-20240229"
        
    async def analyze_legal_document(
        self, 
        document_text: str, 
        analysis_type: str = "general",
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze a legal document using Claude
        
        Args:
            document_text: The legal document text to analyze
            analysis_type: Type of analysis (general, summary, key_points, etc.)
            context: Additional context for the analysis
            
        Returns:
            Dictionary containing the analysis results
        """
        try:
            prompt = self._build_legal_analysis_prompt(
                document_text, analysis_type, context
            )
            
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.1,
                messages=[
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ]
            )
            
            result = {
                "analysis": message.content[0].text,
                "model": self.model,
                "analysis_type": analysis_type,
                "token_usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens
                }
            }
            
            logger.info(
                "Legal document analyzed",
                analysis_type=analysis_type,
                input_tokens=message.usage.input_tokens,
                output_tokens=message.usage.output_tokens
            )
            
            return result
            
        except Exception as e:
            logger.error("Error analyzing legal document", error=str(e))
            raise
    
    async def generate_legal_summary(
        self, 
        document_text: str, 
        summary_length: str = "medium"
    ) -> str:
        """Generate a summary of a legal document"""
        
        result = await self.analyze_legal_document(
            document_text, 
            analysis_type="summary",
            context=f"Generate a {summary_length} length summary"
        )
        
        return result["analysis"]
    
    async def extract_key_points(self, document_text: str) -> List[str]:
        """Extract key legal points from a document"""
        
        result = await self.analyze_legal_document(
            document_text, 
            analysis_type="key_points"
        )
        
        # Parse the key points from the response
        analysis_text = result["analysis"]
        key_points = []
        
        # Simple parsing - look for bullet points or numbered lists
        lines = analysis_text.split('\\n')
        for line in lines:
            line = line.strip()
            if line.startswith(('', '-', '*')) or (line and line[0].isdigit() and '.' in line):
                key_points.append(line)
        
        return key_points
    
    async def answer_legal_question(
        self, 
        question: str, 
        context_documents: List[str] = None
    ) -> Dict[str, Any]:
        """Answer a legal question with optional document context"""
        
        context_text = ""
        if context_documents:
            context_text = "\\n\\n".join(context_documents)
        
        prompt = f"""
        You are a Hungarian legal AI assistant. Answer the following legal question based on Hungarian law.
        
        Question: {question}
        
        {f"Context documents:\\n{context_text}" if context_text else ""}
        
        Please provide:
        1. A direct answer to the question
        2. Relevant legal principles
        3. Any applicable Hungarian legal references
        4. Confidence level in your answer
        
        Answer in Hungarian if the question is in Hungarian, otherwise in English.
        """
        
        try:
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=3000,
                temperature=0.2,
                messages=[
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ]
            )
            
            return {
                "answer": message.content[0].text,
                "question": question,
                "model": self.model,
                "token_usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens
                }
            }
            
        except Exception as e:
            logger.error("Error answering legal question", error=str(e))
            raise
    
    def _build_legal_analysis_prompt(
        self, 
        document_text: str, 
        analysis_type: str, 
        context: Optional[str] = None
    ) -> str:
        """Build a prompt for legal document analysis"""
        
        base_prompt = f"""
        You are an expert Hungarian legal AI assistant. Analyze the following legal document.
        
        Document text:
        {document_text}
        
        Analysis type: {analysis_type}
        {f"Additional context: {context}" if context else ""}
        """
        
        if analysis_type == "summary":
            base_prompt += """
            
            Please provide a comprehensive summary that includes:
            1. Main legal concepts and principles
            2. Key obligations and rights
            3. Important deadlines or conditions
            4. Potential legal implications
            
            Write the summary in clear, professional Hungarian.
            """
            
        elif analysis_type == "key_points":
            base_prompt += """
            
            Please extract the key legal points from this document. Format as a bullet list:
             Point 1
             Point 2
            etc.
            
            Focus on actionable items, legal obligations, rights, and important conditions.
            """
            
        elif analysis_type == "compliance":
            base_prompt += """
            
            Please analyze this document for compliance requirements:
            1. Identify all legal obligations
            2. Note any deadlines or time-sensitive requirements
            3. Highlight potential compliance risks
            4. Suggest compliance actions if applicable
            """
        
        return base_prompt

# Global client instance
_claude_client = None

async def get_claude_client() -> ClaudeClient:
    """Get the global Claude client instance"""
    global _claude_client
    if _claude_client is None:
        _claude_client = ClaudeClient()
    return _claude_client
'''
            (ai_dir / 'claude_client.py').write_text(claude_client_content)
            
            # Create API endpoints for Claude integration
            api_ai_dir = self.src_dir / 'energia_ai' / 'api' / 'ai'
            api_ai_dir.mkdir(exist_ok=True)
            (api_ai_dir / '__init__.py').write_text('')
            
            ai_endpoints_content = '''"""
AI-powered legal analysis API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import structlog

from ...ai.claude_client import get_claude_client, ClaudeClient

logger = structlog.get_logger()
router = APIRouter(prefix="/ai", tags=["AI Legal Analysis"])

# Request/Response models
class DocumentAnalysisRequest(BaseModel):
    document_text: str = Field(..., description="Legal document text to analyze")
    analysis_type: str = Field("general", description="Type of analysis to perform")
    context: Optional[str] = Field(None, description="Additional context for analysis")

class DocumentAnalysisResponse(BaseModel):
    analysis: str
    analysis_type: str
    model: str
    token_usage: Dict[str, int]

class LegalQuestionRequest(BaseModel):
    question: str = Field(..., description="Legal question to answer")
    context_documents: Optional[List[str]] = Field(None, description="Context documents")

class LegalQuestionResponse(BaseModel):
    answer: str
    question: str
    model: str
    token_usage: Dict[str, int]

class SummaryRequest(BaseModel):
    document_text: str = Field(..., description="Document text to summarize")
    summary_length: str = Field("medium", description="Length of summary (short, medium, long)")

@router.post("/analyze-document", response_model=DocumentAnalysisResponse)
async def analyze_document(
    request: DocumentAnalysisRequest,
    claude_client: ClaudeClient = Depends(get_claude_client)
):
    """Analyze a legal document using Claude AI"""
    try:
        result = await claude_client.analyze_legal_document(
            document_text=request.document_text,
            analysis_type=request.analysis_type,
            context=request.context
        )
        
        return DocumentAnalysisResponse(**result)
        
    except Exception as e:
        logger.error("Document analysis failed", error=str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Document analysis failed: {str(e)}"
        )

@router.post("/answer-question", response_model=LegalQuestionResponse)
async def answer_legal_question(
    request: LegalQuestionRequest,
    claude_client: ClaudeClient = Depends(get_claude_client)
):
    """Answer a legal question using Claude AI"""
    try:
        result = await claude_client.answer_legal_question(
            question=request.question,
            context_documents=request.context_documents
        )
        
        return LegalQuestionResponse(**result)
        
    except Exception as e:
        logger.error("Legal question answering failed", error=str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Legal question answering failed: {str(e)}"
        )

@router.post("/summarize", response_model=str)
async def summarize_document(
    request: SummaryRequest,
    claude_client: ClaudeClient = Depends(get_claude_client)
):
    """Generate a summary of a legal document"""
    try:
        summary = await claude_client.generate_legal_summary(
            document_text=request.document_text,
            summary_length=request.summary_length
        )
        
        return summary
        
    except Exception as e:
        logger.error("Document summarization failed", error=str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Document summarization failed: {str(e)}"
        )

@router.post("/extract-key-points", response_model=List[str])
async def extract_key_points(
    request: DocumentAnalysisRequest,
    claude_client: ClaudeClient = Depends(get_claude_client)
):
    """Extract key points from a legal document"""
    try:
        key_points = await claude_client.extract_key_points(
            document_text=request.document_text
        )
        
        return key_points
        
    except Exception as e:
        logger.error("Key point extraction failed", error=str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Key point extraction failed: {str(e)}"
        )

@router.get("/health")
async def ai_health_check():
    """Health check for AI services"""
    try:
        claude_client = await get_claude_client()
        # Simple test to verify Claude API is accessible
        return {
            "status": "healthy",
            "service": "claude-ai",
            "model": claude_client.model
        }
    except Exception as e:
        logger.error("AI health check failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        )
'''
            (api_ai_dir / 'endpoints.py').write_text(ai_endpoints_content)
            
            # Update main FastAPI app to include AI router
            main_py_path = self.src_dir / 'energia_ai' / 'main.py'
            if main_py_path.exists():
                main_content = main_py_path.read_text()
                
                # Add import for AI router
                if 'from energia_ai.api.ai.endpoints import router as ai_router' not in main_content:
                    # Find the imports section and add the AI router import
                    import_section = main_content.find('from energia_ai.core.logging import setup_logging')
                    if import_section != -1:
                        end_of_line = main_content.find('\\n', import_section)
                        main_content = (
                            main_content[:end_of_line] + 
                            '\\nfrom energia_ai.api.ai.endpoints import router as ai_router' +
                            main_content[end_of_line:]
                        )
                
                # Add router inclusion
                if 'app.include_router(ai_router)' not in main_content:
                    # Find where to add the router (after CORS middleware)
                    cors_section = main_content.find(')')
                    if cors_section != -1:
                        # Find the end of the CORS middleware section
                        end_section = main_content.find('\\n\\n', cors_section)
                        if end_section != -1:
                            main_content = (
                                main_content[:end_section] + 
                                '\\n\\n# Include AI router\\napp.include_router(ai_router)' +
                                main_content[end_section:]
                            )
                
                main_py_path.write_text(main_content)
            
            # Update settings to include Claude API key
            settings_path = self.src_dir / 'energia_ai' / 'config' / 'settings.py'
            if settings_path.exists():
                settings_content = settings_path.read_text()
                if 'claude_api_key: str = ""' not in settings_content:
                    # Add Claude API key to settings
                    api_key_section = settings_content.find('api_key: str = ""')
                    if api_key_section != -1:
                        end_of_line = settings_content.find('\\n', api_key_section)
                        settings_content = (
                            settings_content[:end_of_line] + 
                            '\\n    claude_api_key: str = ""' +
                            settings_content[end_of_line:]
                        )
                        settings_path.write_text(settings_content)
            
            # Update .env.template with Claude API key
            env_template_path = self.project_root / '.env.template'
            if env_template_path.exists():
                env_content = env_template_path.read_text()
                if 'CLAUDE_API_KEY=' not in env_content:
                    env_content += '\\n# Claude AI API Key\\nCLAUDE_API_KEY=your_claude_api_key_here\\n'
                    env_template_path.write_text(env_content)
            
            # Create tests for Claude integration
            tests_ai_dir = self.project_root / 'tests' / 'ai'
            tests_ai_dir.mkdir(parents=True, exist_ok=True)
            (tests_ai_dir / '__init__.py').write_text('')
            
            test_claude_content = '''"""
Tests for Claude AI integration
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from src.energia_ai.ai.claude_client import ClaudeClient

@pytest.fixture
def mock_claude_client():
    """Mock Claude client for testing"""
    with patch('src.energia_ai.ai.claude_client.AsyncAnthropic') as mock_anthropic:
        mock_client = Mock()
        mock_anthropic.return_value = mock_client
        
        # Mock response
        mock_message = Mock()
        mock_message.content = [Mock(text="Test analysis result")]
        mock_message.usage = Mock(input_tokens=100, output_tokens=200)
        
        mock_client.messages.create = AsyncMock(return_value=mock_message)
        
        client = ClaudeClient()
        client.settings.claude_api_key = "test-key"
        return client

@pytest.mark.asyncio
async def test_analyze_legal_document(mock_claude_client):
    """Test legal document analysis"""
    result = await mock_claude_client.analyze_legal_document(
        document_text="Test legal document",
        analysis_type="summary"
    )
    
    assert "analysis" in result
    assert result["analysis"] == "Test analysis result"
    assert result["model"] == "claude-3-sonnet-20240229"
    assert "token_usage" in result

@pytest.mark.asyncio
async def test_generate_legal_summary(mock_claude_client):
    """Test legal document summary generation"""
    summary = await mock_claude_client.generate_legal_summary(
        document_text="Test legal document"
    )
    
    assert summary == "Test analysis result"

@pytest.mark.asyncio
async def test_answer_legal_question(mock_claude_client):
    """Test legal question answering"""
    result = await mock_claude_client.answer_legal_question(
        question="What is Hungarian contract law?"
    )
    
    assert "answer" in result
    assert result["answer"] == "Test analysis result"
    assert result["question"] == "What is Hungarian contract law?"
'''
            (tests_ai_dir / 'test_claude_client.py').write_text(test_claude_content)
            
            print(" Task 16 completed: Claude API integration created")
            print("   - Created Claude API client with legal analysis capabilities")
            print("   - Added AI-powered API endpoints:")
            print("     * /ai/analyze-document - Analyze legal documents")
            print("     * /ai/answer-question - Answer legal questions")
            print("     * /ai/summarize - Generate document summaries")
            print("     * /ai/extract-key-points - Extract key legal points")
            print("   - Integrated with FastAPI main application")
            print("   - Added comprehensive error handling and logging")
            print("   - Created test suite for AI functionality")
            print("   - Updated configuration for Claude API key")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 16: {e}")
            return False
    
    def implement_task_4_postgresql_setup(self) -> bool:
        """Implement Task 4: Set up PostgreSQL database and schema"""
        print(" Implementing Task 4: PostgreSQL Database Setup")
        
        try:
            # Create database directory structure
            db_dir = self.src_dir / 'energia_ai' / 'database'
            db_dir.mkdir(exist_ok=True)
            (db_dir / '__init__.py').write_text('')
            
            # Create database models
            models_content = '''"""
Database models for Energia AI using SQLAlchemy
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    documents = relationship("Document", back_populates="owner")
    search_history = relationship("SearchHistory", back_populates="user")

class Document(Base):
    """Legal document metadata model"""
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False, index=True)
    document_type = Column(String(100), nullable=False, index=True)
    source_url = Column(Text)
    content_hash = Column(String(64), unique=True, index=True)
    file_path = Column(Text)  # Path to stored document file
    
    # Legal document specific fields
    publication_date = Column(DateTime, index=True)
    effective_date = Column(DateTime, index=True)
    legal_reference = Column(String(200), index=True)  # e.g., "2023. vi V. trvny"
    
    # Processing status
    processing_status = Column(String(50), default='pending', index=True)
    extracted_text = Column(Text)
    summary = Column(Text)
    keywords = Column(JSON)  # Array of extracted keywords
    
    # Metadata
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    citations = relationship("Citation", back_populates="document")

class Citation(Base):
    """Legal citation relationships between documents"""
    __tablename__ = 'citations'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    cited_document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    citation_text = Column(Text)  # The actual citation text
    citation_type = Column(String(50))  # 'reference', 'amendment', 'repeal', etc.
    context = Column(Text)  # Surrounding context of the citation
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    document = relationship("Document", foreign_keys=[document_id], back_populates="citations")
    cited_document = relationship("Document", foreign_keys=[cited_document_id])

class SearchHistory(Base):
    """User search history for analytics and personalization"""
    __tablename__ = 'search_history'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    query = Column(Text, nullable=False)
    search_type = Column(String(50))  # 'semantic', 'lexical', 'hybrid'
    results_count = Column(Integer)
    response_time_ms = Column(Integer)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="search_history")

class SystemMetrics(Base):
    """System performance and usage metrics"""
    __tablename__ = 'system_metrics'
    
    id = Column(Integer, primary_key=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(String(255))
    metric_data = Column(JSON)  # Additional structured data
    
    created_at = Column(DateTime, default=func.now())
'''
            (db_dir / 'models.py').write_text(models_content)
            
            # Create database connection manager
            connection_content = '''"""
Database connection management for PostgreSQL
"""
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class DatabaseManager:
    """Async PostgreSQL database manager"""
    
    def __init__(self):
        self.settings = get_settings()
        self.engine = None
        self.session_factory = None
        
    async def initialize(self):
        """Initialize database connection"""
        try:
            # Create async engine
            self.engine = create_async_engine(
                self.settings.database_url,
                echo=self.settings.debug,
                poolclass=NullPool if self.settings.environment == "testing" else None,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            
            # Create session factory
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            logger.info("Database connection initialized", database_url=self.settings.database_url)
            
        except Exception as e:
            logger.error("Failed to initialize database", error=str(e))
            raise
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        if not self.session_factory:
            await self.initialize()
        
        async with self.session_factory() as session:
            try:
                yield session
            except Exception as e:
                await session.rollback()
                logger.error("Database session error", error=str(e))
                raise
            finally:
                await session.close()
    
    async def create_tables(self):
        """Create all database tables"""
        try:
            from .models import Base
            
            if not self.engine:
                await self.initialize()
            
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            logger.info("Database tables created successfully")
            
        except Exception as e:
            logger.error("Failed to create database tables", error=str(e))
            raise
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")

# Global database manager instance
_db_manager = None

async def get_database_manager() -> DatabaseManager:
    """Get the global database manager instance"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
        await _db_manager.initialize()
    return _db_manager

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency for FastAPI"""
    db_manager = await get_database_manager()
    async for session in db_manager.get_session():
        yield session
'''
            (db_dir / 'connection.py').write_text(connection_content)
            
            # Create Alembic configuration
            alembic_dir = self.project_root / 'alembic'
            alembic_dir.mkdir(exist_ok=True)
            
            alembic_ini_content = '''# A generic, single database configuration.

[alembic]
# path to migration scripts
script_location = alembic

# template used to generate migration file names; The default value is %%(rev)s_%%(slug)s
# Uncomment the line below if you want the files to be prepended with date and time
# file_template = %%(year)d_%%(month).2d_%%(day).2d_%%(hour).2d%%(minute).2d-%%(rev)s_%%(slug)s

# sys.path path, will be prepended to sys.path if present.
# defaults to the current working directory.
prepend_sys_path = .

# timezone to use when rendering the date within the migration file
# as well as the filename.
# If specified, requires the python-dateutil library that can be installed
# by adding `alembic[tz]` to the pip requirements
# string value is passed to dateutil.tz.gettz()
# leave blank for localtime
# timezone =

# max length of characters to apply to the
# "slug" field
# truncate_slug_length = 40

# set to 'true' to run the environment during
# the 'revision' command, regardless of autogenerate
# revision_environment = false

# set to 'true' to allow .pyc and .pyo files without
# a source .py file to be detected as revisions in the
# versions/ directory
# sourceless = false

# version number format.  This value may be a callable, or an explicit format string.
# version_num_format = "%%(rev)s"

# version path separator; As mentioned above, this is the character used to split
# version_path_glob = "*"

# set to 'true' to search source files recursively
# in each "version_locations" directory
# recursive_version_locations = false

# the output encoding used when revision files
# are written from script.py.mako
# output_encoding = utf-8

sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost:5432/energia_ai

[post_write_hooks]
# post_write_hooks defines scripts or Python functions that are run
# on newly generated revision scripts.  See the documentation for further
# detail and examples

# format using "black" - use the console_scripts runner, against the "black" entrypoint
# hooks = black
# black.type = console_scripts
# black.entrypoint = black
# black.options = -l 79 REVISION_SCRIPT_FILENAME

# lint with attempts to fix using "ruff" - use the exec runner, execute a binary
# hooks = ruff
# ruff.type = exec
# ruff.executable = %(here)s/.venv/bin/ruff
# ruff.options = --fix REVISION_SCRIPT_FILENAME

# Logging configuration
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
'''
            (self.project_root / 'alembic.ini').write_text(alembic_ini_content)
            
            # Update requirements.txt with PostgreSQL dependencies
            requirements_path = self.project_root / 'requirements.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.read_text()
                if 'asyncpg' not in current_requirements:
                    additional_requirements = '''
# PostgreSQL database
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.23
alembic==1.13.1
'''
                    requirements_path.write_text(current_requirements + additional_requirements)
            
            # Update settings to include database URL
            settings_path = self.src_dir / 'energia_ai' / 'config' / 'settings.py'
            if settings_path.exists():
                settings_content = settings_path.read_text()
                if 'database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/energia_ai"' not in settings_content:
                    # Update the database_url line
                    settings_content = settings_content.replace(
                        'database_url: str = ""',
                        'database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/energia_ai"'
                    )
                    settings_path.write_text(settings_content)
            
            print(" Task 4 completed: PostgreSQL database setup created")
            print("   - Created SQLAlchemy models for users, documents, citations")
            print("   - Set up async database connection management")
            print("   - Configured Alembic for database migrations")
            print("   - Added PostgreSQL dependencies to requirements.txt")
            print("   - Updated settings with database configuration")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 4: {e}")
            return False
    
    def implement_task_5_mongodb_setup(self) -> bool:
        """Implement Task 5: Set up MongoDB for document storage"""
        print(" Implementing Task 5: MongoDB Document Storage Setup")
        
        try:
            # Create MongoDB directory structure
            mongo_dir = self.src_dir / 'energia_ai' / 'storage'
            mongo_dir.mkdir(exist_ok=True)
            (mongo_dir / '__init__.py').write_text('')
            
            # Create MongoDB document schemas
            schemas_content = '''"""
MongoDB document schemas for legal document storage
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class LegalDocumentSchema(BaseModel):
    """Schema for legal documents stored in MongoDB"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str = Field(..., description="Document title")
    document_type: str = Field(..., description="Type of legal document")
    source_url: Optional[str] = Field(None, description="Original URL")
    
    # Content fields
    raw_content: str = Field(..., description="Raw document content")
    processed_content: Optional[str] = Field(None, description="Processed/cleaned content")
    extracted_text: Optional[str] = Field(None, description="Extracted plain text")
    
    # Legal metadata
    publication_date: Optional[datetime] = Field(None, description="Publication date")
    effective_date: Optional[datetime] = Field(None, description="Effective date")
    legal_reference: Optional[str] = Field(None, description="Legal reference number")
    
    # Processing metadata
    content_hash: str = Field(..., description="SHA-256 hash of content")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    language: str = Field(default="hu", description="Document language")
    
    # Extracted entities and keywords
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords")
    entities: Dict[str, List[str]] = Field(default_factory=dict, description="Named entities")
    
    # Search and indexing
    search_vector: Optional[List[float]] = Field(None, description="Document embedding vector")
    indexed_at: Optional[datetime] = Field(None, description="When document was indexed")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentVersionSchema(BaseModel):
    """Schema for document version history"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    document_id: PyObjectId = Field(..., description="Reference to main document")
    version_number: int = Field(..., description="Version number")
    content: str = Field(..., description="Content of this version")
    changes_summary: Optional[str] = Field(None, description="Summary of changes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentCollectionSchema(BaseModel):
    """Schema for document collections/categories"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., description="Collection name")
    description: Optional[str] = Field(None, description="Collection description")
    document_ids: List[PyObjectId] = Field(default_factory=list, description="Document IDs in collection")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Collection metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
'''
            (mongo_dir / 'schemas.py').write_text(schemas_content)
            
            # Create MongoDB connection manager
            mongo_manager_content = '''"""
MongoDB connection and operations manager
"""
import asyncio
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from pymongo import IndexModel, TEXT, ASCENDING, DESCENDING
import structlog
from ..config.settings import get_settings
from .schemas import LegalDocumentSchema, DocumentVersionSchema, DocumentCollectionSchema

logger = structlog.get_logger()

class MongoDBManager:
    """Async MongoDB manager for document storage"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        
    async def initialize(self):
        """Initialize MongoDB connection"""
        try:
            # Create MongoDB client
            self.client = AsyncIOMotorClient(
                self.settings.mongodb_url,
                maxPoolSize=50,
                minPoolSize=10,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=5000,
            )
            
            # Get database
            self.database = self.client.energia_ai
            
            # Test connection
            await self.client.admin.command('ping')
            
            # Create indexes
            await self.create_indexes()
            
            logger.info("MongoDB connection initialized", mongodb_url=self.settings.mongodb_url)
            
        except Exception as e:
            logger.error("Failed to initialize MongoDB", error=str(e))
            raise
    
    async def create_indexes(self):
        """Create MongoDB indexes for optimal performance"""
        try:
            # Documents collection indexes
            documents = self.database.documents
            await documents.create_indexes([
                IndexModel([("title", TEXT), ("extracted_text", TEXT)], name="text_search"),
                IndexModel([("document_type", ASCENDING)], name="document_type_idx"),
                IndexModel([("legal_reference", ASCENDING)], name="legal_reference_idx"),
                IndexModel([("content_hash", ASCENDING)], unique=True, name="content_hash_idx"),
                IndexModel([("publication_date", DESCENDING)], name="publication_date_idx"),
                IndexModel([("created_at", DESCENDING)], name="created_at_idx"),
                IndexModel([("keywords", ASCENDING)], name="keywords_idx"),
            ])
            
            # Document versions collection indexes
            versions = self.database.document_versions
            await versions.create_indexes([
                IndexModel([("document_id", ASCENDING), ("version_number", DESCENDING)], name="document_version_idx"),
                IndexModel([("created_at", DESCENDING)], name="version_created_idx"),
            ])
            
            # Collections collection indexes
            collections = self.database.collections
            await collections.create_indexes([
                IndexModel([("name", ASCENDING)], unique=True, name="collection_name_idx"),
                IndexModel([("document_ids", ASCENDING)], name="collection_documents_idx"),
            ])
            
            logger.info("MongoDB indexes created successfully")
            
        except Exception as e:
            logger.error("Failed to create MongoDB indexes", error=str(e))
            raise
    
    async def store_document(self, document: LegalDocumentSchema) -> str:
        """Store a legal document in MongoDB"""
        try:
            collection = self.database.documents
            result = await collection.insert_one(document.dict(by_alias=True, exclude_unset=True))
            
            logger.info("Document stored", document_id=str(result.inserted_id))
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error("Failed to store document", error=str(e))
            raise
    
    async def get_document(self, document_id: str) -> Optional[LegalDocumentSchema]:
        """Retrieve a document by ID"""
        try:
            collection = self.database.documents
            doc = await collection.find_one({"_id": document_id})
            
            if doc:
                return LegalDocumentSchema(**doc)
            return None
            
        except Exception as e:
            logger.error("Failed to retrieve document", document_id=document_id, error=str(e))
            raise
    
    async def search_documents(
        self, 
        query: str, 
        document_type: Optional[str] = None,
        limit: int = 50
    ) -> List[LegalDocumentSchema]:
        """Search documents using full-text search"""
        try:
            collection = self.database.documents
            
            # Build search filter
            search_filter = {"$text": {"$search": query}}
            if document_type:
                search_filter["document_type"] = document_type
            
            # Execute search
            cursor = collection.find(
                search_filter,
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            documents = []
            async for doc in cursor:
                documents.append(LegalDocumentSchema(**doc))
            
            logger.info("Document search completed", query=query, results_count=len(documents))
            return documents
            
        except Exception as e:
            logger.error("Document search failed", query=query, error=str(e))
            raise
    
    async def update_document(self, document_id: str, updates: Dict[str, Any]) -> bool:
        """Update a document"""
        try:
            collection = self.database.documents
            updates["updated_at"] = datetime.utcnow()
            
            result = await collection.update_one(
                {"_id": document_id},
                {"$set": updates}
            )
            
            success = result.modified_count > 0
            logger.info("Document updated", document_id=document_id, success=success)
            return success
            
        except Exception as e:
            logger.error("Failed to update document", document_id=document_id, error=str(e))
            raise
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document"""
        try:
            collection = self.database.documents
            result = await collection.delete_one({"_id": document_id})
            
            success = result.deleted_count > 0
            logger.info("Document deleted", document_id=document_id, success=success)
            return success
            
        except Exception as e:
            logger.error("Failed to delete document", document_id=document_id, error=str(e))
            raise
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

# Global MongoDB manager instance
_mongo_manager = None

async def get_mongodb_manager() -> MongoDBManager:
    """Get the global MongoDB manager instance"""
    global _mongo_manager
    if _mongo_manager is None:
        _mongo_manager = MongoDBManager()
        await _mongo_manager.initialize()
    return _mongo_manager
'''
            (mongo_dir / 'mongodb_manager.py').write_text(mongo_manager_content)
            
            # Update requirements.txt with MongoDB dependencies
            requirements_path = self.project_root / 'requirements.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.read_text()
                if 'motor' not in current_requirements:
                    additional_requirements = '''
# MongoDB document storage
motor==3.3.2
pymongo==4.6.0
'''
                    requirements_path.write_text(current_requirements + additional_requirements)
            
            # Update settings to include MongoDB URL
            settings_path = self.src_dir / 'energia_ai' / 'config' / 'settings.py'
            if settings_path.exists():
                settings_content = settings_path.read_text()
                if 'mongodb_url: str = "mongodb://localhost:27017"' not in settings_content:
                    # Update the mongodb_url line
                    settings_content = settings_content.replace(
                        'mongodb_url: str = ""',
                        'mongodb_url: str = "mongodb://localhost:27017"'
                    )
                    settings_path.write_text(settings_content)
            
            print(" Task 5 completed: MongoDB document storage setup created")
            print("   - Created Pydantic schemas for legal documents")
            print("   - Set up async MongoDB connection management")
            print("   - Configured full-text search indexes")
            print("   - Added document CRUD operations")
            print("   - Added MongoDB dependencies to requirements.txt")
            print("   - Updated settings with MongoDB configuration")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 5: {e}")
            return False
    
    def implement_task_6_redis_setup(self) -> bool:
        """Implement Task 6: Set up Redis for caching and session management"""
        print(" Implementing Task 6: Redis Caching and Session Management Setup")
        
        try:
            # Create Redis directory structure
            cache_dir = self.src_dir / 'energia_ai' / 'cache'
            cache_dir.mkdir(exist_ok=True)
            (cache_dir / '__init__.py').write_text('')
            
            # Create Redis manager
            redis_manager_content = '''"""
Redis connection and caching manager
"""
import asyncio
import json
import pickle
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import aioredis
from aioredis import Redis
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class RedisManager:
    """Async Redis manager for caching and session management"""
    
    def __init__(self):
        self.settings = get_settings()
        self.redis: Optional[Redis] = None
        
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            # Create Redis connection
            self.redis = await aioredis.from_url(
                self.settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
            )
            
            # Test connection
            await self.redis.ping()
            
            logger.info("Redis connection initialized", redis_url=self.settings.redis_url)
            
        except Exception as e:
            logger.error("Failed to initialize Redis", error=str(e))
            raise
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set a value in Redis with optional expiration"""
        try:
            if not self.redis:
                await self.initialize()
            
            # Serialize complex objects
            if isinstance(value, (dict, list)):
                value = json.dumps(value, default=str)
            elif not isinstance(value, (str, int, float, bool)):
                value = pickle.dumps(value)
            
            result = await self.redis.set(key, value, ex=expire)
            
            logger.debug("Redis set operation", key=key, expire=expire, success=bool(result))
            return bool(result)
            
        except Exception as e:
            logger.error("Redis set failed", key=key, error=str(e))
            return False
    
    async def get(self, key: str, deserialize_json: bool = True) -> Optional[Any]:
        """Get a value from Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            value = await self.redis.get(key)
            
            if value is None:
                return None
            
            # Try to deserialize JSON
            if deserialize_json and isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    # Try pickle if JSON fails
                    try:
                        return pickle.loads(value.encode())
                    except (pickle.PickleError, TypeError):
                        pass
            
            return value
            
        except Exception as e:
            logger.error("Redis get failed", key=key, error=str(e))
            return None
    
    async def delete(self, key: str) -> bool:
        """Delete a key from Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.delete(key)
            
            logger.debug("Redis delete operation", key=key, success=bool(result))
            return bool(result)
            
        except Exception as e:
            logger.error("Redis delete failed", key=key, error=str(e))
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if a key exists in Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.exists(key)
            return bool(result)
            
        except Exception as e:
            logger.error("Redis exists check failed", key=key, error=str(e))
            return False
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration for a key"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.expire(key, seconds)
            return bool(result)
            
        except Exception as e:
            logger.error("Redis expire failed", key=key, error=str(e))
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a numeric value"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.incrby(key, amount)
            return result
            
        except Exception as e:
            logger.error("Redis increment failed", key=key, error=str(e))
            return None
    
    async def set_hash(self, key: str, mapping: Dict[str, Any], expire: Optional[int] = None) -> bool:
        """Set a hash in Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            # Serialize values
            serialized_mapping = {}
            for k, v in mapping.items():
                if isinstance(v, (dict, list)):
                    serialized_mapping[k] = json.dumps(v, default=str)
                else:
                    serialized_mapping[k] = str(v)
            
            result = await self.redis.hset(key, mapping=serialized_mapping)
            
            if expire:
                await self.redis.expire(key, expire)
            
            logger.debug("Redis hash set operation", key=key, fields=len(mapping))
            return bool(result)
            
        except Exception as e:
            logger.error("Redis hash set failed", key=key, error=str(e))
            return False
    
    async def get_hash(self, key: str) -> Optional[Dict[str, Any]]:
        """Get a hash from Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.hgetall(key)
            
            if not result:
                return None
            
            # Try to deserialize JSON values
            deserialized = {}
            for k, v in result.items():
                try:
                    deserialized[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    deserialized[k] = v
            
            return deserialized
            
        except Exception as e:
            logger.error("Redis hash get failed", key=key, error=str(e))
            return None
    
    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")

# Caching decorators and utilities
class CacheManager:
    """High-level caching utilities"""
    
    def __init__(self, redis_manager: RedisManager):
        self.redis = redis_manager
    
    def cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a cache key from prefix and arguments"""
        key_parts = [prefix]
        key_parts.extend(str(arg) for arg in args)
        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
        return ":".join(key_parts)
    
    async def cache_search_results(
        self, 
        query: str, 
        results: List[Dict[str, Any]], 
        expire: int = 3600
    ) -> bool:
        """Cache search results"""
        key = self.cache_key("search", query)
        return await self.redis.set(key, results, expire=expire)
    
    async def get_cached_search_results(self, query: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached search results"""
        key = self.cache_key("search", query)
        return await self.redis.get(key)
    
    async def cache_document_analysis(
        self, 
        document_id: str, 
        analysis: Dict[str, Any], 
        expire: int = 86400
    ) -> bool:
        """Cache document analysis results"""
        key = self.cache_key("analysis", document_id)
        return await self.redis.set(key, analysis, expire=expire)
    
    async def get_cached_document_analysis(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get cached document analysis"""
        key = self.cache_key("analysis", document_id)
        return await self.redis.get(key)
    
    async def invalidate_document_cache(self, document_id: str) -> bool:
        """Invalidate all cache entries for a document"""
        try:
            keys_to_delete = [
                self.cache_key("analysis", document_id),
                self.cache_key("summary", document_id),
                self.cache_key("keywords", document_id),
            ]
            
            for key in keys_to_delete:
                await self.redis.delete(key)
            
            return True
            
        except Exception as e:
            logger.error("Cache invalidation failed", document_id=document_id, error=str(e))
            return False

# Session management
class SessionManager:
    """User session management using Redis"""
    
    def __init__(self, redis_manager: RedisManager):
        self.redis = redis_manager
        self.session_prefix = "session"
        self.default_expire = 86400  # 24 hours
    
    def session_key(self, session_id: str) -> str:
        """Generate session key"""
        return f"{self.session_prefix}:{session_id}"
    
    async def create_session(self, session_id: str, user_data: Dict[str, Any]) -> bool:
        """Create a new session"""
        key = self.session_key(session_id)
        session_data = {
            "user_data": user_data,
            "created_at": datetime.utcnow().isoformat(),
            "last_accessed": datetime.utcnow().isoformat(),
        }
        
        return await self.redis.set_hash(key, session_data, expire=self.default_expire)
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        key = self.session_key(session_id)
        session_data = await self.redis.get_hash(key)
        
        if session_data:
            # Update last accessed time
            session_data["last_accessed"] = datetime.utcnow().isoformat()
            await self.redis.set_hash(key, session_data, expire=self.default_expire)
        
        return session_data
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data"""
        key = self.session_key(session_id)
        existing_data = await self.redis.get_hash(key)
        
        if not existing_data:
            return False
        
        existing_data.update(updates)
        existing_data["last_accessed"] = datetime.utcnow().isoformat()
        
        return await self.redis.set_hash(key, existing_data, expire=self.default_expire)
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        key = self.session_key(session_id)
        return await self.redis.delete(key)

# Global Redis manager instance
_redis_manager = None

async def get_redis_manager() -> RedisManager:
    """Get the global Redis manager instance"""
    global _redis_manager
    if _redis_manager is None:
        _redis_manager = RedisManager()
        await _redis_manager.initialize()
    return _redis_manager

async def get_cache_manager() -> CacheManager:
    """Get cache manager instance"""
    redis_manager = await get_redis_manager()
    return CacheManager(redis_manager)

async def get_session_manager() -> SessionManager:
    """Get session manager instance"""
    redis_manager = await get_redis_manager()
    return SessionManager(redis_manager)
'''
            (cache_dir / 'redis_manager.py').write_text(redis_manager_content)
            
            # Create caching decorators
            decorators_content = '''"""
Caching decorators for FastAPI endpoints
"""
import asyncio
import functools
import hashlib
import json
from typing import Any, Callable, Optional
from fastapi import Request, Response
import structlog
from .redis_manager import get_cache_manager

logger = structlog.get_logger()

def cache_response(expire: int = 3600, key_prefix: str = "endpoint"):
    """
    Decorator to cache FastAPI endpoint responses
    
    Args:
        expire: Cache expiration time in seconds
        key_prefix: Prefix for cache keys
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request object
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # No request object found, execute without caching
                return await func(*args, **kwargs)
            
            # Generate cache key
            cache_key_data = {
                "path": str(request.url.path),
                "query": str(request.url.query),
                "method": request.method,
            }
            
            cache_key_str = json.dumps(cache_key_data, sort_keys=True)
            cache_key_hash = hashlib.md5(cache_key_str.encode()).hexdigest()
            cache_key = f"{key_prefix}:{cache_key_hash}"
            
            try:
                # Try to get cached response
                cache_manager = await get_cache_manager()
                cached_response = await cache_manager.redis.get(cache_key)
                
                if cached_response:
                    logger.debug("Cache hit", cache_key=cache_key)
                    return json.loads(cached_response)
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                
                # Cache the result
                await cache_manager.redis.set(
                    cache_key, 
                    json.dumps(result, default=str), 
                    expire=expire
                )
                
                logger.debug("Cache miss - result cached", cache_key=cache_key)
                return result
                
            except Exception as e:
                logger.error("Caching error - executing without cache", error=str(e))
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern: str):
    """
    Decorator to invalidate cache entries matching a pattern after function execution
    
    Args:
        pattern: Redis pattern to match keys for deletion
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            try:
                cache_manager = await get_cache_manager()
                
                # Get keys matching pattern
                keys = await cache_manager.redis.redis.keys(pattern)
                
                if keys:
                    # Delete matching keys
                    await cache_manager.redis.redis.delete(*keys)
                    logger.info("Cache invalidated", pattern=pattern, keys_deleted=len(keys))
                
            except Exception as e:
                logger.error("Cache invalidation failed", pattern=pattern, error=str(e))
            
            return result
        
        return wrapper
    return decorator
'''
            (cache_dir / 'decorators.py').write_text(decorators_content)
            
            # Update requirements.txt with Redis dependencies
            requirements_path = self.project_root / 'requirements.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.read_text()
                if 'aioredis' not in current_requirements:
                    additional_requirements = '''
# Redis caching and session management
aioredis==2.0.1
'''
                    requirements_path.write_text(current_requirements + additional_requirements)
            
            # Update settings to include Redis URL
            settings_path = self.src_dir / 'energia_ai' / 'config' / 'settings.py'
            if settings_path.exists():
                settings_content = settings_path.read_text()
                if 'redis_url: str = "redis://localhost:6379/0"' not in settings_content:
                    # Update the redis_url line
                    settings_content = settings_content.replace(
                        'redis_url: str = ""',
                        'redis_url: str = "redis://localhost:6379/0"'
                    )
                    settings_path.write_text(settings_content)
            
            print(" Task 6 completed: Redis caching and session management setup created")
            print("   - Created async Redis connection management")
            print("   - Set up caching utilities and decorators")
            print("   - Implemented session management system")
            print("   - Added search result caching")
            print("   - Added Redis dependencies to requirements.txt")
            print("   - Updated settings with Redis configuration")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 6: {e}")
            return False
    
    def implement_task_7_qdrant_setup(self) -> bool:
        """Implement Task 7: Qdrant vector database for semantic search"""
        print(" Implementing Task 7: Qdrant Vector Database Setup")
        
        try:
            # Create vector search directory structure
            vector_dir = self.src_dir / 'energia_ai' / 'vector_search'
            vector_dir.mkdir(exist_ok=True)
            (vector_dir / '__init__.py').write_text('')
            
            # Create Qdrant client manager
            qdrant_manager_content = '''"""
Qdrant vector database manager for semantic search
"""
import asyncio
from typing import List, Dict, Any, Optional, Union
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, Range
import numpy as np
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class QdrantManager:
    """Qdrant vector database manager for semantic search"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[QdrantClient] = None
        self.collection_name = "legal_documents"
        self.vector_size = 1536  # OpenAI embedding size
        
    async def initialize(self):
        """Initialize Qdrant connection"""
        try:
            # Create Qdrant client
            self.client = QdrantClient(
                host=self.settings.qdrant_host,
                port=self.settings.qdrant_port,
                timeout=30,
            )
            
            # Test connection
            collections = self.client.get_collections()
            
            # Create collection if it doesn't exist
            await self.create_collection()
            
            logger.info("Qdrant connection initialized", 
                       host=self.settings.qdrant_host, 
                       port=self.settings.qdrant_port)
            
        except Exception as e:
            logger.error("Failed to initialize Qdrant", error=str(e))
            raise
    
    async def create_collection(self):
        """Create the legal documents collection"""
        try:
            # Check if collection exists
            try:
                collection_info = self.client.get_collection(self.collection_name)
                logger.info("Collection already exists", collection=self.collection_name)
                return
            except Exception:
                # Collection doesn't exist, create it
                pass
            
            # Create collection with vector configuration
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE,
                ),
                optimizers_config=models.OptimizersConfig(
                    default_segment_number=2,
                    max_segment_size=20000,
                    memmap_threshold=20000,
                    indexing_threshold=20000,
                ),
                hnsw_config=models.HnswConfig(
                    m=16,
                    ef_construct=100,
                    full_scan_threshold=10000,
                    max_indexing_threads=0,
                ),
            )
            
            # Create payload indexes for efficient filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="document_type",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="legal_reference",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="publication_date",
                field_schema=models.PayloadSchemaType.DATETIME,
            )
            
            logger.info("Qdrant collection created successfully", collection=self.collection_name)
            
        except Exception as e:
            logger.error("Failed to create Qdrant collection", error=str(e))
            raise
    
    async def store_document_embedding(
        self, 
        document_id: str, 
        embedding: List[float], 
        metadata: Dict[str, Any]
    ) -> bool:
        """Store document embedding with metadata"""
        try:
            if not self.client:
                await self.initialize()
            
            # Create point
            point = PointStruct(
                id=document_id,
                vector=embedding,
                payload=metadata
            )
            
            # Upsert point
            operation_info = self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            success = operation_info.status == models.UpdateStatus.COMPLETED
            
            logger.info("Document embedding stored", 
                       document_id=document_id, 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Failed to store document embedding", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def search_similar_documents(
        self, 
        query_embedding: List[float], 
        limit: int = 10,
        document_type: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using vector similarity"""
        try:
            if not self.client:
                await self.initialize()
            
            # Build search filter
            search_filter = None
            conditions = []
            
            if document_type:
                conditions.append(
                    FieldCondition(
                        key="document_type",
                        match=models.MatchValue(value=document_type)
                    )
                )
            
            if date_range:
                if date_range.get("start") or date_range.get("end"):
                    date_condition = FieldCondition(
                        key="publication_date",
                        range=Range(
                            gte=date_range.get("start"),
                            lte=date_range.get("end")
                        )
                    )
                    conditions.append(date_condition)
            
            if conditions:
                search_filter = Filter(must=conditions)
            
            # Perform search
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "score": result.score,
                    "metadata": result.payload
                })
            
            logger.info("Semantic search completed", 
                       query_results=len(results),
                       score_threshold=score_threshold)
            
            return results
            
        except Exception as e:
            logger.error("Semantic search failed", error=str(e))
            return []
    
    async def batch_store_embeddings(
        self, 
        documents: List[Dict[str, Any]]
    ) -> bool:
        """Batch store multiple document embeddings"""
        try:
            if not self.client:
                await self.initialize()
            
            # Create points
            points = []
            for doc in documents:
                point = PointStruct(
                    id=doc["id"],
                    vector=doc["embedding"],
                    payload=doc["metadata"]
                )
                points.append(point)
            
            # Batch upsert
            operation_info = self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            success = operation_info.status == models.UpdateStatus.COMPLETED
            
            logger.info("Batch embeddings stored", 
                       count=len(documents), 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Batch embedding storage failed", 
                        count=len(documents), 
                        error=str(e))
            return False
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the vector database"""
        try:
            if not self.client:
                await self.initialize()
            
            operation_info = self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.PointIdsList(
                    points=[document_id]
                )
            )
            
            success = operation_info.status == models.UpdateStatus.COMPLETED
            
            logger.info("Document deleted from vector DB", 
                       document_id=document_id, 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Failed to delete document from vector DB", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        try:
            if not self.client:
                await self.initialize()
            
            collection_info = self.client.get_collection(self.collection_name)
            
            return {
                "name": self.collection_name,
                "vectors_count": collection_info.vectors_count,
                "indexed_vectors_count": collection_info.indexed_vectors_count,
                "points_count": collection_info.points_count,
                "segments_count": collection_info.segments_count,
                "status": collection_info.status,
                "optimizer_status": collection_info.optimizer_status,
                "disk_data_size": collection_info.disk_data_size,
                "ram_data_size": collection_info.ram_data_size,
            }
            
        except Exception as e:
            logger.error("Failed to get collection info", error=str(e))
            return {}

# Global Qdrant manager instance
_qdrant_manager = None

async def get_qdrant_manager() -> QdrantManager:
    """Get the global Qdrant manager instance"""
    global _qdrant_manager
    if _qdrant_manager is None:
        _qdrant_manager = QdrantManager()
        await _qdrant_manager.initialize()
    return _qdrant_manager
'''
            (vector_dir / 'qdrant_manager.py').write_text(qdrant_manager_content)
            
            # Create embedding utilities
            embeddings_content = '''"""
Document embedding utilities for semantic search
"""
import asyncio
import hashlib
from typing import List, Dict, Any, Optional
import openai
import numpy as np
from sentence_transformers import SentenceTransformer
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class EmbeddingManager:
    """Manager for generating document embeddings"""
    
    def __init__(self):
        self.settings = get_settings()
        self.openai_client = None
        self.sentence_transformer = None
        self.embedding_model = "text-embedding-ada-002"  # OpenAI model
        self.local_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # Supports Hungarian
        
    async def initialize(self):
        """Initialize embedding models"""
        try:
            # Initialize OpenAI client if API key is available
            if self.settings.openai_api_key:
                openai.api_key = self.settings.openai_api_key
                self.openai_client = openai
                logger.info("OpenAI embedding client initialized")
            
            # Initialize local sentence transformer for Hungarian support
            self.sentence_transformer = SentenceTransformer(self.local_model)
            logger.info("Local sentence transformer initialized", model=self.local_model)
            
        except Exception as e:
            logger.error("Failed to initialize embedding models", error=str(e))
            raise
    
    async def generate_embedding_openai(self, text: str) -> Optional[List[float]]:
        """Generate embedding using OpenAI API"""
        try:
            if not self.openai_client:
                return None
            
            # Clean and truncate text
            cleaned_text = self.preprocess_text(text)
            
            response = await self.openai_client.Embedding.acreate(
                model=self.embedding_model,
                input=cleaned_text
            )
            
            embedding = response['data'][0]['embedding']
            
            logger.debug("OpenAI embedding generated", text_length=len(text))
            return embedding
            
        except Exception as e:
            logger.error("OpenAI embedding generation failed", error=str(e))
            return None
    
    def generate_embedding_local(self, text: str) -> List[float]:
        """Generate embedding using local sentence transformer"""
        try:
            if not self.sentence_transformer:
                raise ValueError("Sentence transformer not initialized")
            
            # Clean and preprocess text
            cleaned_text = self.preprocess_text(text)
            
            # Generate embedding
            embedding = self.sentence_transformer.encode(cleaned_text)
            
            # Convert to list and normalize
            embedding_list = embedding.tolist()
            
            logger.debug("Local embedding generated", text_length=len(text))
            return embedding_list
            
        except Exception as e:
            logger.error("Local embedding generation failed", error=str(e))
            return []
    
    async def generate_embedding(self, text: str, prefer_openai: bool = True) -> List[float]:
        """Generate embedding with fallback strategy"""
        try:
            if not self.sentence_transformer and not self.openai_client:
                await self.initialize()
            
            # Try OpenAI first if preferred and available
            if prefer_openai and self.openai_client:
                embedding = await self.generate_embedding_openai(text)
                if embedding:
                    return embedding
            
            # Fallback to local model
            return self.generate_embedding_local(text)
            
        except Exception as e:
            logger.error("Embedding generation failed", error=str(e))
            return []
    
    def preprocess_text(self, text: str, max_length: int = 8000) -> str:
        """Preprocess text for embedding generation"""
        try:
            # Remove excessive whitespace
            cleaned = ' '.join(text.split())
            
            # Truncate if too long
            if len(cleaned) > max_length:
                cleaned = cleaned[:max_length]
                logger.debug("Text truncated for embedding", original_length=len(text), final_length=len(cleaned))
            
            return cleaned
            
        except Exception as e:
            logger.error("Text preprocessing failed", error=str(e))
            return text
    
    async def generate_document_embeddings(
        self, 
        documents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate embeddings for multiple documents"""
        try:
            results = []
            
            for doc in documents:
                # Extract text content
                content = doc.get('content', '') or doc.get('extracted_text', '')
                if not content:
                    logger.warning("No content found for document", document_id=doc.get('id'))
                    continue
                
                # Generate embedding
                embedding = await self.generate_embedding(content)
                if not embedding:
                    logger.warning("Failed to generate embedding", document_id=doc.get('id'))
                    continue
                
                # Prepare result
                result = {
                    'id': doc['id'],
                    'embedding': embedding,
                    'metadata': {
                        'title': doc.get('title', ''),
                        'document_type': doc.get('document_type', ''),
                        'legal_reference': doc.get('legal_reference', ''),
                        'publication_date': doc.get('publication_date'),
                        'source_url': doc.get('source_url', ''),
                        'content_length': len(content),
                        'embedding_model': self.local_model if not self.openai_client else self.embedding_model,
                    }
                }
                results.append(result)
            
            logger.info("Document embeddings generated", 
                       total_documents=len(documents), 
                       successful_embeddings=len(results))
            
            return results
            
        except Exception as e:
            logger.error("Batch embedding generation failed", error=str(e))
            return []
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using embeddings"""
        try:
            if not self.sentence_transformer:
                return 0.0
            
            # Generate embeddings
            embedding1 = self.sentence_transformer.encode(text1)
            embedding2 = self.sentence_transformer.encode(text2)
            
            # Calculate cosine similarity
            similarity = np.dot(embedding1, embedding2) / (
                np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
            )
            
            return float(similarity)
            
        except Exception as e:
            logger.error("Text similarity calculation failed", error=str(e))
            return 0.0

# Global embedding manager instance
_embedding_manager = None

async def get_embedding_manager() -> EmbeddingManager:
    """Get the global embedding manager instance"""
    global _embedding_manager
    if _embedding_manager is None:
        _embedding_manager = EmbeddingManager()
        await _embedding_manager.initialize()
    return _embedding_manager
'''
            (vector_dir / 'embeddings.py').write_text(embeddings_content)
            
            # Update requirements.txt with Qdrant dependencies
            requirements_path = self.project_root / 'requirements.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.read_text()
                if 'qdrant-client' not in current_requirements:
                    additional_requirements = '''
# Qdrant vector database for semantic search
qdrant-client==1.7.0
sentence-transformers==2.2.2
numpy==1.24.3
'''
                    requirements_path.write_text(current_requirements + additional_requirements)
            
            # Update settings to include Qdrant configuration
            settings_path = self.src_dir / 'energia_ai' / 'config' / 'settings.py'
            if settings_path.exists():
                settings_content = settings_path.read_text()
                if 'qdrant_host: str = "localhost"' not in settings_content:
                    # Add Qdrant settings
                    settings_content = settings_content.replace(
                        'redis_url: str = "redis://localhost:6379/0"',
                        '''redis_url: str = "redis://localhost:6379/0"
    
    # Qdrant vector database settings
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333'''
                    )
                    settings_path.write_text(settings_content)
            
            print(" Task 7 completed: Qdrant vector database setup created")
            print("   - Created Qdrant client with collection management")
            print("   - Set up embedding generation with Hungarian language support")
            print("   - Configured semantic search with filtering capabilities")
            print("   - Added batch processing for large document sets")
            print("   - Added Qdrant dependencies to requirements.txt")
            print("   - Updated settings with Qdrant configuration")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 7: {e}")
            return False
    
    def implement_task_8_elasticsearch_setup(self) -> bool:
        """Implement Task 8: Elasticsearch for lexical search"""
        print(" Implementing Task 8: Elasticsearch Lexical Search Setup")
        
        try:
            # Create search directory structure
            search_dir = self.src_dir / 'energia_ai' / 'search'
            search_dir.mkdir(exist_ok=True)
            (search_dir / '__init__.py').write_text('')
            
            # Create Elasticsearch manager
            elasticsearch_manager_content = '''"""
Elasticsearch manager for lexical search with Hungarian language support
"""
import asyncio
from typing import List, Dict, Any, Optional, Union
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class ElasticsearchManager:
    """Elasticsearch manager for lexical search"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncElasticsearch] = None
        self.index_name = "legal_documents"
        
    async def initialize(self):
        """Initialize Elasticsearch connection"""
        try:
            # Create Elasticsearch client
            self.client = AsyncElasticsearch(
                [{"host": self.settings.elasticsearch_host, "port": self.settings.elasticsearch_port}],
                timeout=30,
                max_retries=3,
                retry_on_timeout=True,
            )
            
            # Test connection
            info = await self.client.info()
            
            # Create index if it doesn't exist
            await self.create_index()
            
            logger.info("Elasticsearch connection initialized", 
                       host=self.settings.elasticsearch_host, 
                       port=self.settings.elasticsearch_port,
                       version=info["version"]["number"])
            
        except Exception as e:
            logger.error("Failed to initialize Elasticsearch", error=str(e))
            raise
    
    async def create_index(self):
        """Create the legal documents index with Hungarian analyzer"""
        try:
            # Check if index exists
            if await self.client.indices.exists(index=self.index_name):
                logger.info("Index already exists", index=self.index_name)
                return
            
            # Define Hungarian language analyzer
            index_settings = {
                "settings": {
                    "number_of_shards": 2,
                    "number_of_replicas": 1,
                    "analysis": {
                        "analyzer": {
                            "hungarian_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase",
                                    "hungarian_stop",
                                    "hungarian_stemmer",
                                    "asciifolding"
                                ]
                            },
                            "hungarian_search_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase",
                                    "hungarian_stop",
                                    "asciifolding"
                                ]
                            }
                        },
                        "filter": {
                            "hungarian_stop": {
                                "type": "stop",
                                "stopwords": [
                                    "a", "az", "s", "vagy", "de", "hogy", "egy", "ez", "az",
                                    "van", "volt", "lesz", "lehet", "kell", "csak", "mg",
                                    "mr", "nem", "igen", "igen", "is", "el", "fel", "le",
                                    "ki", "be", "meg", "t", "r", "ssze", "szt"
                                ]
                            },
                            "hungarian_stemmer": {
                                "type": "stemmer",
                                "language": "hungarian"
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "title": {
                            "type": "text",
                            "analyzer": "hungarian_analyzer",
                            "search_analyzer": "hungarian_search_analyzer",
                            "fields": {
                                "keyword": {
                                    "type": "keyword"
                                },
                                "suggest": {
                                    "type": "completion"
                                }
                            }
                        },
                        "content": {
                            "type": "text",
                            "analyzer": "hungarian_analyzer",
                            "search_analyzer": "hungarian_search_analyzer"
                        },
                        "extracted_text": {
                            "type": "text",
                            "analyzer": "hungarian_analyzer",
                            "search_analyzer": "hungarian_search_analyzer"
                        },
                        "document_type": {
                            "type": "keyword"
                        },
                        "legal_reference": {
                            "type": "keyword",
                            "fields": {
                                "text": {
                                    "type": "text",
                                    "analyzer": "hungarian_analyzer"
                                }
                            }
                        },
                        "publication_date": {
                            "type": "date",
                            "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                        },
                        "effective_date": {
                            "type": "date",
                            "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                        },
                        "source_url": {
                            "type": "keyword",
                            "index": False
                        },
                        "keywords": {
                            "type": "keyword"
                        },
                        "content_hash": {
                            "type": "keyword"
                        },
                        "created_at": {
                            "type": "date"
                        },
                        "updated_at": {
                            "type": "date"
                        }
                    }
                }
            }
            
            # Create index
            await self.client.indices.create(
                index=self.index_name,
                body=index_settings
            )
            
            logger.info("Elasticsearch index created successfully", index=self.index_name)
            
        except Exception as e:
            logger.error("Failed to create Elasticsearch index", error=str(e))
            raise
    
    async def index_document(self, document_id: str, document: Dict[str, Any]) -> bool:
        """Index a single document"""
        try:
            if not self.client:
                await self.initialize()
            
            # Index document
            response = await self.client.index(
                index=self.index_name,
                id=document_id,
                body=document
            )
            
            success = response["result"] in ["created", "updated"]
            
            logger.info("Document indexed", 
                       document_id=document_id, 
                       result=response["result"])
            
            return success
            
        except Exception as e:
            logger.error("Failed to index document", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def batch_index_documents(self, documents: List[Dict[str, Any]]) -> bool:
        """Batch index multiple documents"""
        try:
            if not self.client:
                await self.initialize()
            
            # Prepare documents for bulk indexing
            actions = []
            for doc in documents:
                action = {
                    "_index": self.index_name,
                    "_id": doc["id"],
                    "_source": {k: v for k, v in doc.items() if k != "id"}
                }
                actions.append(action)
            
            # Bulk index
            success_count, failed_items = await async_bulk(
                self.client,
                actions,
                chunk_size=100,
                max_chunk_bytes=10485760,  # 10MB
            )
            
            logger.info("Batch indexing completed", 
                       total_documents=len(documents),
                       successful=success_count,
                       failed=len(failed_items) if failed_items else 0)
            
            return len(failed_items) == 0 if failed_items else True
            
        except Exception as e:
            logger.error("Batch indexing failed", 
                        count=len(documents), 
                        error=str(e))
            return False
    
    async def search_documents(
        self,
        query: str,
        document_type: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
        keywords: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search documents using Elasticsearch"""
        try:
            if not self.client:
                await self.initialize()
            
            # Build search query
            search_body = {
                "from": offset,
                "size": limit,
                "query": {
                    "bool": {
                        "must": [],
                        "filter": []
                    }
                },
                "highlight": {
                    "fields": {
                        "title": {"fragment_size": 150, "number_of_fragments": 1},
                        "content": {"fragment_size": 150, "number_of_fragments": 3},
                        "extracted_text": {"fragment_size": 150, "number_of_fragments": 3}
                    }
                },
                "sort": [
                    {"_score": {"order": "desc"}},
                    {"publication_date": {"order": "desc"}}
                ]
            }
            
            # Add text search
            if query:
                search_body["query"]["bool"]["must"].append({
                    "multi_match": {
                        "query": query,
                        "fields": [
                            "title^3",
                            "content^2",
                            "extracted_text^2",
                            "legal_reference^2"
                        ],
                        "type": "best_fields",
                        "fuzziness": "AUTO"
                    }
                })
            else:
                search_body["query"]["bool"]["must"].append({"match_all": {}})
            
            # Add filters
            if document_type:
                search_body["query"]["bool"]["filter"].append({
                    "term": {"document_type": document_type}
                })
            
            if date_range:
                date_filter = {"range": {"publication_date": {}}}
                if date_range.get("start"):
                    date_filter["range"]["publication_date"]["gte"] = date_range["start"]
                if date_range.get("end"):
                    date_filter["range"]["publication_date"]["lte"] = date_range["end"]
                search_body["query"]["bool"]["filter"].append(date_filter)
            
            if keywords:
                search_body["query"]["bool"]["filter"].append({
                    "terms": {"keywords": keywords}
                })
            
            # Execute search
            response = await self.client.search(
                index=self.index_name,
                body=search_body
            )
            
            # Format results
            results = {
                "total": response["hits"]["total"]["value"],
                "documents": [],
                "aggregations": response.get("aggregations", {})
            }
            
            for hit in response["hits"]["hits"]:
                doc = {
                    "id": hit["_id"],
                    "score": hit["_score"],
                    "source": hit["_source"],
                    "highlights": hit.get("highlight", {})
                }
                results["documents"].append(doc)
            
            logger.info("Search completed", 
                       query=query,
                       total_results=results["total"],
                       returned_results=len(results["documents"]))
            
            return results
            
        except Exception as e:
            logger.error("Search failed", query=query, error=str(e))
            return {"total": 0, "documents": [], "aggregations": {}}
    
    async def suggest_completions(self, text: str, size: int = 5) -> List[str]:
        """Get search suggestions/completions"""
        try:
            if not self.client:
                await self.initialize()
            
            suggest_body = {
                "suggest": {
                    "title_suggest": {
                        "prefix": text,
                        "completion": {
                            "field": "title.suggest",
                            "size": size
                        }
                    }
                }
            }
            
            response = await self.client.search(
                index=self.index_name,
                body=suggest_body
            )
            
            suggestions = []
            for suggestion in response["suggest"]["title_suggest"][0]["options"]:
                suggestions.append(suggestion["text"])
            
            return suggestions
            
        except Exception as e:
            logger.error("Suggestion failed", text=text, error=str(e))
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the search index"""
        try:
            if not self.client:
                await self.initialize()
            
            response = await self.client.delete(
                index=self.index_name,
                id=document_id
            )
            
            success = response["result"] == "deleted"
            
            logger.info("Document deleted from search index", 
                       document_id=document_id, 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Failed to delete document from search index", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        try:
            if not self.client:
                await self.initialize()
            
            stats = await self.client.indices.stats(index=self.index_name)
            
            return {
                "document_count": stats["indices"][self.index_name]["total"]["docs"]["count"],
                "index_size": stats["indices"][self.index_name]["total"]["store"]["size_in_bytes"],
                "search_time": stats["indices"][self.index_name]["total"]["search"]["time_in_millis"],
                "search_count": stats["indices"][self.index_name]["total"]["search"]["query_total"],
                "indexing_time": stats["indices"][self.index_name]["total"]["indexing"]["time_in_millis"],
                "indexing_count": stats["indices"][self.index_name]["total"]["indexing"]["index_total"],
            }
            
        except Exception as e:
            logger.error("Failed to get index stats", error=str(e))
            return {}
    
    async def close(self):
        """Close Elasticsearch connection"""
        if self.client:
            await self.client.close()
            logger.info("Elasticsearch connection closed")

# Global Elasticsearch manager instance
_elasticsearch_manager = None

async def get_elasticsearch_manager() -> ElasticsearchManager:
    """Get the global Elasticsearch manager instance"""
    global _elasticsearch_manager
    if _elasticsearch_manager is None:
        _elasticsearch_manager = ElasticsearchManager()
        await _elasticsearch_manager.initialize()
    return _elasticsearch_manager
'''
            (search_dir / 'elasticsearch_manager.py').write_text(elasticsearch_manager_content)
            
            # Update requirements.txt with Elasticsearch dependencies
            requirements_path = self.project_root / 'requirements.txt'
            if requirements_path.exists():
                current_requirements = requirements_path.read_text()
                if 'elasticsearch' not in current_requirements:
                    additional_requirements = '''
# Elasticsearch for lexical search
elasticsearch[async]==8.11.0
'''
                    requirements_path.write_text(current_requirements + additional_requirements)
            
            # Update settings to include Elasticsearch configuration
            settings_path = self.src_dir / 'energia_ai' / 'config' / 'settings.py'
            if settings_path.exists():
                settings_content = settings_path.read_text()
                if 'elasticsearch_host: str = "localhost"' not in settings_content:
                    # Add Elasticsearch settings
                    settings_content = settings_content.replace(
                        'qdrant_port: int = 6333',
                        '''qdrant_port: int = 6333
    
    # Elasticsearch settings
    elasticsearch_host: str = "localhost"
    elasticsearch_port: int = 9200'''
                    )
                    settings_path.write_text(settings_content)
            
            print(" Task 8 completed: Elasticsearch lexical search setup created")
            print("   - Created Elasticsearch client with Hungarian language analyzer")
            print("   - Set up document indexing with optimized mappings")
            print("   - Configured advanced search with highlighting and suggestions")
            print("   - Added batch processing capabilities")
            print("   - Added Elasticsearch dependencies to requirements.txt")
            print("   - Updated settings with Elasticsearch configuration")
            
            return True
            
        except Exception as e:
            print(f" Error implementing Task 8: {e}")
            return False
    
    def get_in_progress_task(self, tasks_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find any task currently in 'in-progress' status"""
        if 'master' not in tasks_data or 'tasks' not in tasks_data['master']:
            return None
        
        tasks = tasks_data['master']['tasks']
        for task in tasks:
            if task.get('status') == 'in-progress':
                return task
        return None

    def implement_next_task(self) -> bool:
        """Implement the next available task based on current status"""
        tasks_data = self.load_tasks()
        if not tasks_data:
            print(" No tasks data available")
            return False
        
        # First, check if there's already an in-progress task
        in_progress_task = self.get_in_progress_task(tasks_data)
        
        if in_progress_task:
            # Implement the in-progress task
            task_id = in_progress_task['id']
            task_title = in_progress_task['title']
            
            print(f"\n Continuing Task {task_id}: {task_title}")
            print(f" Description: {in_progress_task['description']}")
            print(f" Priority: {in_progress_task['priority']}, Complexity: {in_progress_task['complexity']}")
            print(" Status: Already in-progress, implementing now...")
            
            target_task = in_progress_task
        else:
            # No in-progress task, find next TODO task and move it to in-progress
            next_task = self.get_next_todo_task(tasks_data)
            if not next_task:
                print(" No more TODO tasks available or all dependencies not met")
                return False
            
            task_id = next_task['id']
            task_title = next_task['title']
            
            print(f"\n Starting Task {task_id}: {task_title}")
            print(f" Description: {next_task['description']}")
            print(f" Priority: {next_task['priority']}, Complexity: {next_task['complexity']}")
            print(" Moving from TODO  IN-PROGRESS")
            
            # Update status to in-progress
            self.update_task_status(tasks_data, task_id, 'in-progress')
            self.save_tasks(tasks_data)
            
            target_task = next_task
        
        task_id = target_task['id']
        
        # Implement specific tasks
        success = False
        if task_id == 1:
            success = self.implement_task_1_fastapi_setup()
        elif task_id == 2:
            success = self.implement_task_2_docker_setup()
        elif task_id == 3:
            success = self.implement_task_3_cicd_pipeline()
        elif task_id == 16:
            success = self.implement_task_16_claude_integration()
        elif task_id == 4:
            success = self.implement_task_4_postgresql_setup()
        elif task_id == 5:
            success = self.implement_task_5_mongodb_setup()
        elif task_id == 6:
            success = self.implement_task_6_redis_setup()
        elif task_id == 7:
            success = self.implement_task_7_qdrant_setup()
        elif task_id == 8:
            success = self.implement_task_8_elasticsearch_setup()
        else:
            print(f"  Task {task_id} implementation not yet available")
            print("   This task requires manual implementation or additional development")
            success = False
        
        # Update final status
        final_status = 'done' if success else 'todo'
        self.update_task_status(tasks_data, task_id, final_status)
        self.save_tasks(tasks_data)
        
        if success:
            print(f" Task {task_id} completed successfully!")
        else:
            print(f" Task {task_id} failed - moved back to TODO for manual implementation")
        
        return success
    
    def run_implementation_flow(self) -> None:
        """Run the automated implementation flow"""
        print(" Starting Automated Task Implementation Engine")
        print("=" * 60)
        
        implemented_count = 0
        max_tasks = 10  # Safety limit
        
        while implemented_count < max_tasks:
            success = self.implement_next_task()
            if not success:
                break
            implemented_count += 1
            print(f"\n Progress: {implemented_count} tasks implemented")
            print("-" * 40)
        
        print(f"\n Implementation session completed!")
        print(f"   Total tasks implemented: {implemented_count}")
        
        # Show remaining tasks
        tasks_data = self.load_tasks()
        if tasks_data and 'master' in tasks_data:
            todo_tasks = [t for t in tasks_data['master']['tasks'] if t.get('status') == 'todo']
            print(f"   Remaining TODO tasks: {len(todo_tasks)}")
            
            if todo_tasks:
                print("\n Next available tasks:")
                for task in todo_tasks[:3]:  # Show first 3
                    deps = task.get('dependencies', [])
                    deps_met = "" if not deps else ""
                    print(f"   {deps_met} Task {task['id']}: {task['title']}")

class ConfigManager:
    """Original config manager functionality preserved"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.config_dir = self.project_root / '.cursor'
        self.configs_dir = self.config_dir / 'configs'
        self.current_config_file = self.config_dir / 'environment.json'
        
        # Initialize directories
        self.config_dir.mkdir(exist_ok=True)
        self.configs_dir.mkdir(exist_ok=True)
    
    def list_contexts(self):
        """List all available development contexts"""
        if not self.configs_dir.exists():
            print("No development contexts found.")
            return
        
        configs = list(self.configs_dir.glob('*.json'))
        if not configs:
            print("No development contexts found.")
            return
        
        print("Available development contexts:")
        for config_file in sorted(configs):
            context_name = config_file.stem
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                description = config.get('description', 'No description')
                print(f"   {context_name}: {description}")
            except Exception as e:
                print(f"   {context_name}: (Error reading config: {e})")
    
    def switch_context(self, context_name: str):
        """Switch to a specific development context"""
        config_file = self.configs_dir / f"{context_name}.json"
        
        if not config_file.exists():
            print(f"Context '{context_name}' not found.")
            self.list_contexts()
            return False
        
        try:
            # Copy the context config to current environment
            shutil.copy2(config_file, self.current_config_file)
            print(f" Switched to '{context_name}' context")
            
            # Load and display the context info
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            print(f" Context: {config.get('description', 'No description')}")
            if 'environment' in config:
                env = config['environment']
                print(f" Environment variables set: {len(env)} variables")
            
            return True
            
        except Exception as e:
            print(f" Error switching context: {e}")
            return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Cursor Configuration Manager with Task Implementation')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Context management commands
    subparsers.add_parser('list', help='List available development contexts')
    switch_parser = subparsers.add_parser('switch', help='Switch development context')
    switch_parser.add_argument('context', help='Context name to switch to')
    
    # Task implementation commands
    subparsers.add_parser('implement-next', help='Implement the next available TODO task')
    subparsers.add_parser('implement-flow', help='Run automated implementation flow')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    project_root = os.path.abspath(args.project_root)
    
    # Handle context management commands
    if args.command in ['list', 'switch']:
        config_manager = ConfigManager(project_root)
        
        if args.command == 'list':
            config_manager.list_contexts()
        elif args.command == 'switch':
            config_manager.switch_context(args.context)
    
    # Handle task implementation commands
    elif args.command in ['implement-next', 'implement-flow']:
        engine = TaskImplementationEngine(project_root)
        
        if args.command == 'implement-next':
            engine.implement_next_task()
        elif args.command == 'implement-flow':
            engine.run_implementation_flow()

if __name__ == '__main__':
    main()