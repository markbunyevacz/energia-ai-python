# Development Guardrails - Python Backend

This document establishes the development guidelines, constraints, and best practices for the Energia Legal AI Python backend system to ensure code quality, maintainability, and consistency.

## 🏗️ Code Organization Principles

### 1. **Project Structure Standards**

#### **Directory Organization**
```
app/
├── core/                    # Core configuration and utilities
│   ├── config.py           # Application configuration
│   ├── database.py         # Database connections
│   ├── security.py         # Security utilities
│   ├── logging.py          # Logging configuration
│   └── exceptions.py       # Custom exceptions
├── api/                     # API layer (FastAPI)
│   ├── routers/            # API route handlers
│   │   ├── auth.py         # Authentication routes
│   │   ├── documents.py    # Document management
│   │   ├── analysis.py     # Analysis endpoints
│   │   └── admin.py        # Admin operations
│   ├── dependencies.py     # Dependency injection
│   ├── middleware.py       # Custom middleware
│   └── models/             # Request/Response models
├── services/               # Business logic layer
│   ├── ai_service.py       # AI model integration
│   ├── document_service.py # Document processing
│   ├── crawler_service.py  # Web crawling
│   ├── notification_service.py # Notifications
│   └── analysis_service.py # Legal analysis
├── models/                 # Data models
│   ├── database/           # Database models
│   │   ├── base.py         # Base model class
│   │   ├── user.py         # User models
│   │   ├── document.py     # Document models
│   │   └── analysis.py     # Analysis models
│   └── api/                # API models (Pydantic)
├── crawlers/               # Web crawling modules
│   ├── base_crawler.py     # Base crawler class
│   ├── jogtar_crawler.py   # Jogtár crawler
│   └── magyar_kozlony_crawler.py # Magyar Közlöny
├── utils/                  # Utility functions
│   ├── text_processing.py  # Text utilities
│   ├── file_handlers.py    # File operations
│   └── validators.py       # Input validation
└── tests/                  # Test modules
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── fixtures/           # Test fixtures
```

#### **Module Responsibilities**
- **`core/`**: Fundamental system configuration and cross-cutting concerns
- **`api/`**: HTTP endpoints and request handling - NO business logic
- **`services/`**: Business logic implementation - domain-specific operations
- **`models/`**: Data structures and validation - clear separation between DB and API models
- **`utils/`**: Pure functions and utilities - no side effects
- **`tests/`**: Comprehensive test coverage with clear organization

### 2. **Import Organization**
```python
# Standard library imports (first)
import asyncio
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

# Third-party imports (second)
import httpx
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client

# Local imports (third)
from app.core.config import settings
from app.core.database import get_db
from app.models.database.document import LegalDocument
from app.services.ai_service import AIService
```

## 🔧 Code Quality Standards

### 1. **Type Annotations**
**MANDATORY**: All functions must have complete type annotations

```python
# ✅ Good
async def analyze_document(
    document_id: str,
    user_id: str,
    analysis_type: str = "standard"
) -> DocumentAnalysis:
    """Analyze a legal document with specified analysis type."""
    pass

# ❌ Bad
async def analyze_document(document_id, user_id, analysis_type="standard"):
    pass
```

### 2. **Error Handling**
**MANDATORY**: Explicit error handling with custom exceptions

```python
# Custom exceptions
class DocumentNotFoundError(Exception):
    """Raised when a requested document is not found."""
    pass

class AnalysisError(Exception):
    """Raised when document analysis fails."""
    pass

# ✅ Good - Explicit error handling
async def get_document(document_id: str) -> LegalDocument:
    try:
        result = await db.fetch_document(document_id)
        if not result:
            raise DocumentNotFoundError(f"Document {document_id} not found")
        return LegalDocument.from_db(result)
    except DatabaseConnectionError as e:
        logger.error(f"Database error fetching document {document_id}: {e}")
        raise AnalysisError("Database connection failed") from e

# ❌ Bad - Silent failures or generic exceptions
async def get_document(document_id: str):
    try:
        return await db.fetch_document(document_id)
    except:
        return None
```

### 3. **Logging Standards**
**MANDATORY**: Structured logging with appropriate levels

```python
import logging
from app.core.logging import get_logger

logger = get_logger(__name__)

# ✅ Good - Structured logging
async def process_document(document: LegalDocument) -> ProcessingResult:
    logger.info(
        "Starting document processing",
        extra={
            "document_id": document.id,
            "document_type": document.type,
            "user_id": document.user_id
        }
    )
    
    try:
        result = await ai_service.analyze(document)
        
        logger.info(
            "Document processing completed successfully",
            extra={
                "document_id": document.id,
                "processing_time": result.processing_time,
                "confidence_score": result.confidence
            }
        )
        
        return result
        
    except AnalysisError as e:
        logger.error(
            "Document processing failed",
            extra={
                "document_id": document.id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        )
        raise

# ❌ Bad - Unstructured logging
async def process_document(document):
    print(f"Processing document {document.id}")
    try:
        result = await ai_service.analyze(document)
        print("Done")
        return result
    except Exception as e:
        print(f"Error: {e}")
        raise
```

### 4. **Documentation Standards**
**MANDATORY**: Comprehensive docstrings for all public functions and classes

```python
# ✅ Good - Complete docstring
async def analyze_contract_clause(
    clause_text: str,
    contract_type: str,
    jurisdiction: str = "HU"
) -> ClauseAnalysis:
    """
    Analyze a specific contract clause for legal risks and compliance.
    
    Args:
        clause_text: The text content of the clause to analyze
        contract_type: The type of contract (e.g., 'employment', 'commercial')
        jurisdiction: The legal jurisdiction code (default: 'HU' for Hungary)
    
    Returns:
        ClauseAnalysis: Analysis results including risk assessment and recommendations
    
    Raises:
        ValueError: If clause_text is empty or invalid
        AnalysisError: If the AI analysis fails
        
    Example:
        >>> clause = "The employee must work 60 hours per week..."
        >>> analysis = await analyze_contract_clause(clause, "employment")
        >>> print(analysis.risk_level)
        'HIGH'
    """
    if not clause_text.strip():
        raise ValueError("Clause text cannot be empty")
    
    # Implementation here...
    
# ❌ Bad - No or minimal documentation
async def analyze_contract_clause(clause_text, contract_type, jurisdiction="HU"):
    # Analyze clause
    pass
```

## 🎯 API Design Standards

### 1. **RESTful Endpoint Design**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.api.document import DocumentCreateRequest, DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

# ✅ Good - RESTful design with proper status codes
@router.post(
    "/",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new legal document",
    description="Upload and create a new legal document for analysis"
)
async def create_document(
    request: DocumentCreateRequest,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
) -> DocumentResponse:
    """Create a new legal document."""
    try:
        document = await document_service.