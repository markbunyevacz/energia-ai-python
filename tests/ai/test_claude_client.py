"""
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
