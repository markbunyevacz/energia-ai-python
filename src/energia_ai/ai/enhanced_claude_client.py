"""
Enhanced Claude API client with advanced legal analysis capabilities
"""
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass
import anthropic
from anthropic import AsyncAnthropic
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class LegalDocumentType(Enum):
    """Types of legal documents"""
    LAW = "law"
    REGULATION = "regulation" 
    DECREE = "decree"
    CONTRACT = "contract"
    JUDGMENT = "judgment"
    OPINION = "legal_opinion"
    MEMO = "legal_memo"
    OTHER = "other"

class AnalysisComplexity(Enum):
    """Analysis complexity levels"""
    BASIC = "basic"
    STANDARD = "standard"
    COMPREHENSIVE = "comprehensive"
    EXPERT = "expert"

@dataclass
class LegalAnalysisRequest:
    """Structured request for legal analysis"""
    document_text: str
    document_type: LegalDocumentType
    analysis_type: str
    complexity: AnalysisComplexity = AnalysisComplexity.STANDARD
    context: Optional[str] = None
    focus_areas: List[str] = None
    language: str = "hu"  # Hungarian by default
    
class EnhancedClaudeClient:
    """Enhanced Claude API client with advanced legal capabilities"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = AsyncAnthropic(
            api_key=self.settings.claude_api_key
        )
        self.model = "claude-3-5-sonnet-20241022"  # Latest model
        self.analysis_history = []
        
    async def analyze_legal_document_enhanced(
        self, 
        request: LegalAnalysisRequest
    ) -> Dict[str, Any]:
        """
        Enhanced legal document analysis with structured input/output
        """
        try:
            prompt = self._build_enhanced_prompt(request)
            
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=self._get_max_tokens(request.complexity),
                temperature=self._get_temperature(request.analysis_type),
                messages=[
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ]
            )
            
            analysis_id = str(uuid.uuid4())
            result = {
                "analysis_id": analysis_id,
                "timestamp": datetime.now().isoformat(),
                "request": {
                    "document_type": request.document_type.value,
                    "analysis_type": request.analysis_type,
                    "complexity": request.complexity.value,
                    "language": request.language
                },
                "analysis": message.content[0].text,
                "model": self.model,
                "token_usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens,
                    "total_tokens": message.usage.input_tokens + message.usage.output_tokens
                },
                "cost_estimate": self._calculate_cost(message.usage)
            }
            
            # Store in history
            self.analysis_history.append(result)
            
            logger.info(
                "Enhanced legal document analyzed",
                analysis_id=analysis_id,
                document_type=request.document_type.value,
                analysis_type=request.analysis_type,
                complexity=request.complexity.value,
                total_tokens=result["token_usage"]["total_tokens"]
            )
            
            return result
            
        except Exception as e:
            logger.error("Error in enhanced legal analysis", error=str(e))
            raise
    
    async def legal_compliance_check(
        self, 
        document_text: str, 
        regulations: List[str] = None
    ) -> Dict[str, Any]:
        """Check document compliance against Hungarian legal regulations"""
        
        regulations_context = ""
        if regulations:
            regulations_context = f"Specific regulations to check: {', '.join(regulations)}"
        
        prompt = f"""
        You are an expert Hungarian legal compliance analyst. Perform a comprehensive compliance check on the following document.
        
        Document to analyze:
        {document_text}
        
        {regulations_context}
        
        Please provide a structured compliance analysis in JSON format:
        {{
            "overall_compliance_score": 0-100,
            "compliance_status": "compliant|partially_compliant|non_compliant",
            "critical_issues": ["list of critical compliance issues"],
            "moderate_issues": ["list of moderate issues"],
            "recommendations": ["list of recommendations"],
            "regulatory_references": ["relevant Hungarian legal references"],
            "risk_assessment": {{
                "legal_risk": "low|medium|high",
                "financial_risk": "low|medium|high",
                "operational_risk": "low|medium|high"
            }}
        }}
        
        Analyze according to current Hungarian law and regulations.
        """
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        
        try:
            # Try to parse JSON response
            json_start = message.content[0].text.find('{')
            json_end = message.content[0].text.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                compliance_data = json.loads(message.content[0].text[json_start:json_end])
            else:
                compliance_data = {"raw_analysis": message.content[0].text}
        except json.JSONDecodeError:
            compliance_data = {"raw_analysis": message.content[0].text}
        
        return {
            "compliance_analysis": compliance_data,
            "token_usage": {
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens
            }
        }
    
    async def legal_research_assistant(
        self, 
        research_query: str, 
        case_context: Optional[str] = None,
        research_depth: str = "standard"
    ) -> Dict[str, Any]:
        """AI-powered legal research assistant"""
        
        depth_instructions = {
            "basic": "Provide a concise overview",
            "standard": "Provide detailed analysis with key references", 
            "comprehensive": "Provide exhaustive research with multiple perspectives and extensive references"
        }
        
        prompt = f"""
        You are an expert Hungarian legal researcher. Conduct legal research on the following query.
        
        Research Query: {research_query}
        
        {f"Case Context: {case_context}" if case_context else ""}
        
        Research Depth: {depth_instructions.get(research_depth, depth_instructions['standard'])}
        
        Please provide a structured research report:
        
        1. **Kutatási összefoglaló** (Research Summary)
        2. **Vonatkozó jogszabályok** (Applicable Laws)
        3. **Releváns bírósági döntések** (Relevant Court Decisions) 
        4. **Jogi precedensek** (Legal Precedents)
        5. **Gyakorlati megfontolások** (Practical Considerations)
        6. **Ajánlott további kutatási irányok** (Recommended Further Research)
        7. **Hivatkozások** (References)
        
        Focus on Hungarian law and legal system. Provide specific legal references where possible.
        """
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=5000 if research_depth == "comprehensive" else 3000,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "research_report": message.content[0].text,
            "query": research_query,
            "research_depth": research_depth,
            "timestamp": datetime.now().isoformat(),
            "token_usage": {
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens
            }
        }
    
    async def contract_analysis_suite(
        self, 
        contract_text: str
    ) -> Dict[str, Any]:
        """Comprehensive contract analysis suite"""
        
        analyses = await asyncio.gather(
            self._analyze_contract_terms(contract_text),
            self._analyze_contract_risks(contract_text),
            self._analyze_contract_obligations(contract_text),
            return_exceptions=True
        )
        
        return {
            "contract_terms": analyses[0] if not isinstance(analyses[0], Exception) else None,
            "risk_analysis": analyses[1] if not isinstance(analyses[1], Exception) else None,
            "obligations": analyses[2] if not isinstance(analyses[2], Exception) else None,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _analyze_contract_terms(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract terms and conditions"""
        prompt = f"""
        Analyze the key terms and conditions in this contract:
        
        {contract_text}
        
        Identify:
        1. Payment terms
        2. Delivery/performance terms  
        3. Termination clauses
        4. Liability limitations
        5. Governing law
        6. Dispute resolution
        """
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {"analysis": message.content[0].text}
    
    async def _analyze_contract_risks(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract risks"""
        prompt = f"""
        Perform a risk analysis on this contract:
        
        {contract_text}
        
        Identify:
        1. High-risk clauses
        2. Ambiguous terms
        3. Missing protections
        4. Regulatory compliance risks
        5. Financial exposure
        """
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {"risk_analysis": message.content[0].text}
    
    async def _analyze_contract_obligations(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract obligations for all parties"""
        prompt = f"""
        Extract and analyze obligations for all parties in this contract:
        
        {contract_text}
        
        For each party, identify:
        1. Performance obligations
        2. Deadlines and milestones
        3. Reporting requirements
        4. Compliance obligations
        """
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {"obligations": message.content[0].text}
    
    def _build_enhanced_prompt(self, request: LegalAnalysisRequest) -> str:
        """Build enhanced prompt based on request parameters"""
        
        complexity_instructions = {
            AnalysisComplexity.BASIC: "Provide a concise, high-level analysis",
            AnalysisComplexity.STANDARD: "Provide a detailed analysis with key insights",
            AnalysisComplexity.COMPREHENSIVE: "Provide an exhaustive analysis covering all aspects",
            AnalysisComplexity.EXPERT: "Provide expert-level analysis with deep legal insights and nuanced interpretation"
        }
        
        document_type_context = {
            LegalDocumentType.LAW: "This is a law/statute. Focus on legal principles, scope, and implementation.",
            LegalDocumentType.REGULATION: "This is a regulation. Focus on compliance requirements and practical application.",
            LegalDocumentType.CONTRACT: "This is a contract. Focus on terms, obligations, and risks.",
            LegalDocumentType.JUDGMENT: "This is a court judgment. Focus on legal reasoning and precedent value."
        }
        
        base_prompt = f"""
        You are an expert Hungarian legal AI assistant with deep knowledge of Hungarian law and legal practice.
        
        Document Type: {request.document_type.value}
        Analysis Type: {request.analysis_type}
        Complexity Level: {request.complexity.value}
        Language: {request.language}
        
        {document_type_context.get(request.document_type, "")}
        {complexity_instructions[request.complexity]}
        
        Document to analyze:
        {request.document_text}
        
        {f"Additional Context: {request.context}" if request.context else ""}
        {f"Focus Areas: {', '.join(request.focus_areas)}" if request.focus_areas else ""}
        
        Please provide your analysis in {"Hungarian" if request.language == "hu" else "English"}.
        """
        
        return base_prompt
    
    def _get_max_tokens(self, complexity: AnalysisComplexity) -> int:
        """Get max tokens based on complexity"""
        token_map = {
            AnalysisComplexity.BASIC: 1500,
            AnalysisComplexity.STANDARD: 3000,
            AnalysisComplexity.COMPREHENSIVE: 5000,
            AnalysisComplexity.EXPERT: 7000
        }
        return token_map[complexity]
    
    def _get_temperature(self, analysis_type: str) -> float:
        """Get temperature based on analysis type"""
        if analysis_type in ["compliance", "risk", "legal_opinion"]:
            return 0.1  # More deterministic for compliance/risk
        elif analysis_type in ["summary", "key_points"]:
            return 0.2  # Slightly more creative for summaries
        else:
            return 0.3  # Default
    
    def _calculate_cost(self, usage) -> Dict[str, float]:
        """Calculate estimated cost based on token usage"""
        # Claude 3.5 Sonnet pricing (approximate)
        input_cost_per_1k = 0.003  # $3 per 1M tokens
        output_cost_per_1k = 0.015  # $15 per 1M tokens
        
        input_cost = (usage.input_tokens / 1000) * input_cost_per_1k
        output_cost = (usage.output_tokens / 1000) * output_cost_per_1k
        total_cost = input_cost + output_cost
        
        return {
            "input_cost_usd": round(input_cost, 6),
            "output_cost_usd": round(output_cost, 6),
            "total_cost_usd": round(total_cost, 6)
        }
    
    async def get_analysis_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent analysis history"""
        return self.analysis_history[-limit:]
    
    async def export_analysis(self, analysis_id: str, format: str = "json") -> str:
        """Export analysis in specified format"""
        analysis = next((a for a in self.analysis_history if a["analysis_id"] == analysis_id), None)
        if not analysis:
            raise ValueError(f"Analysis {analysis_id} not found")
        
        if format == "json":
            return json.dumps(analysis, indent=2, ensure_ascii=False)
        elif format == "markdown":
            return self._convert_to_markdown(analysis)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _convert_to_markdown(self, analysis: Dict[str, Any]) -> str:
        """Convert analysis to markdown format"""
        md = f"""# Legal Analysis Report

**Analysis ID:** {analysis['analysis_id']}
**Timestamp:** {analysis['timestamp']}
**Document Type:** {analysis['request']['document_type']}
**Analysis Type:** {analysis['request']['analysis_type']}
**Complexity:** {analysis['request']['complexity']}

## Analysis Results

{analysis['analysis']}

## Token Usage

- Input Tokens: {analysis['token_usage']['input_tokens']}
- Output Tokens: {analysis['token_usage']['output_tokens']}
- Total Tokens: {analysis['token_usage']['total_tokens']}
- Estimated Cost: ${analysis['cost_estimate']['total_cost_usd']}

---
*Generated by Energia AI Legal Analysis System*
"""
        return md

# Factory function for easy import
async def get_enhanced_claude_client() -> EnhancedClaudeClient:
    """Get enhanced Claude client instance"""
    return EnhancedClaudeClient() 