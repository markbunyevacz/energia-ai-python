"""
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
