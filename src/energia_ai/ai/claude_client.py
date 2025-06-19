"""
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
        lines = analysis_text.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith(('•', '-', '*', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')) or (line and line[0].isdigit() and '.' in line):
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
            context_text = "\n\n".join(context_documents)
        
        prompt = f"""
        You are a Hungarian legal AI assistant. Answer the following legal question based on Hungarian law.
        
        Question: {question}
        
        {f"Context documents:\n{context_text}" if context_text else ""}
        
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
            • Point 1
            • Point 2
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
