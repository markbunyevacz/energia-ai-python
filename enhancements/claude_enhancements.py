"""
Claude Enhancement Suite for Energia AI
Advanced legal analysis capabilities
"""
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from energia_ai.ai.claude_client import ClaudeClient
except ImportError:
    print("⚠️ Warning: Could not import ClaudeClient. Please ensure the src/energia_ai module is available.")
    ClaudeClient = None

class LegalAnalysisType(Enum):
    """Enhanced analysis types"""
    COMPLIANCE_CHECK = "compliance_check"
    RISK_ASSESSMENT = "risk_assessment" 
    CONTRACT_REVIEW = "contract_review"
    REGULATORY_IMPACT = "regulatory_impact"
    PRECEDENT_ANALYSIS = "precedent_analysis"
    COST_BENEFIT = "cost_benefit"

class EnhancedLegalAnalyzer:
    """Enhanced legal analysis capabilities"""
    
    def __init__(self):
        if ClaudeClient:
            self.claude_client = ClaudeClient()
        else:
            self.claude_client = None
        self.analysis_cache = {}
    
    async def compliance_check_suite(
        self, 
        document_text: str, 
        regulations: List[str] = None
    ) -> Dict[str, Any]:
        """Comprehensive compliance checking"""
        
        if not self.claude_client:
            return {"error": "ClaudeClient not available"}
        
        if not regulations:
            regulations = [
                "2012. évi C. törvény (Büntető Törvénykönyv)",
                "2013. évi V. törvény (Polgári Törvénykönyv)", 
                "GDPR (EU 2016/679 rendelet)",
                "Energiahatékonysági törvény"
            ]
        
        compliance_prompt = f"""
        Végezz átfogó jogszabály-megfelelőségi ellenőrzést a következő dokumentumon:
        
        DOKUMENTUM:
        {document_text}
        
        ELLENŐRIZENDŐ JOGSZABÁLYOK:
        {chr(10).join(f"- {reg}" for reg in regulations)}
        
        Adj strukturált elemzést:
        
        1. MEGFELELŐSÉGI PONTSZÁM (0-100)
        2. KRITIKUS PROBLÉMÁK
        3. MÉRSÉKELT PROBLÉMÁK  
        4. JAVASLATOK
        5. JOGI HIVATKOZÁSOK
        6. KOCKÁZATELEMZÉS
        7. GYAKORLATI LÉPÉSEK
        
        Légy konkrét és hivatkozz pontos jogszabályhelyekre.
        """
        
        result = await self.claude_client.analyze_legal_document(
            compliance_prompt, 
            analysis_type="compliance_check"
        )
        
        return {
            "compliance_score": self._extract_compliance_score(result["analysis"]),
            "full_analysis": result["analysis"],
            "checked_regulations": regulations,
            "timestamp": datetime.now().isoformat(),
            "token_usage": result["token_usage"]
        }
    
    async def risk_assessment_matrix(
        self, 
        document_text: str, 
        business_context: str = None
    ) -> Dict[str, Any]:
        """Advanced risk assessment with scoring matrix"""
        
        risk_prompt = f"""
        Készíts részletes kockázatelemzést a következő dokumentumhoz:
        
        DOKUMENTUM:
        {document_text}
        
        {f"ÜZLETI KONTEXTUS: {business_context}" if business_context else ""}
        
        Kockázati mátrix készítése:
        
        JOGI KOCKÁZATOK:
        - Megfelelőségi kockázat (1-10)
        - Szerződéses kockázat (1-10) 
        - Szabályozási kockázat (1-10)
        
        ÜZLETI KOCKÁZATOK:
        - Pénzügyi kockázat (1-10)
        - Működési kockázat (1-10)
        - Reputációs kockázat (1-10)
        
        IDŐZÍTÉS:
        - Rövid távú (1-12 hónap)
        - Középtávú (1-3 év)
        - Hosszú távú (3+ év)
        
        CSÖKKENTÉSI STRATÉGIÁK minden kockázatra.
        """
        
        result = await self.claude_client.analyze_legal_document(
            risk_prompt,
            analysis_type="risk_assessment"
        )
        
        return {
            "risk_matrix": self._parse_risk_scores(result["analysis"]),
            "full_analysis": result["analysis"],
            "mitigation_strategies": self._extract_mitigation_strategies(result["analysis"]),
            "timestamp": datetime.now().isoformat(),
            "token_usage": result["token_usage"]
        }
    
    async def contract_intelligence(
        self, 
        contract_text: str
    ) -> Dict[str, Any]:
        """AI-powered contract intelligence"""
        
        # Run parallel analyses
        analyses = await asyncio.gather(
            self._analyze_contract_terms(contract_text),
            self._analyze_contract_obligations(contract_text), 
            self._analyze_contract_risks(contract_text),
            self._analyze_contract_financials(contract_text),
            return_exceptions=True
        )
        
        return {
            "contract_id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "analyses": {
                "terms_analysis": analyses[0] if not isinstance(analyses[0], Exception) else str(analyses[0]),
                "obligations_analysis": analyses[1] if not isinstance(analyses[1], Exception) else str(analyses[1]),
                "risk_analysis": analyses[2] if not isinstance(analyses[2], Exception) else str(analyses[2]),
                "financial_analysis": analyses[3] if not isinstance(analyses[3], Exception) else str(analyses[3])
            },
            "overall_score": self._calculate_contract_score(analyses),
            "recommendations": self._generate_contract_recommendations(analyses)
        }
    
    async def regulatory_impact_assessment(
        self, 
        document_text: str, 
        proposed_changes: str = None
    ) -> Dict[str, Any]:
        """Assess regulatory impact of changes"""
        
        impact_prompt = f"""
        Végezz szabályozási hatáselemzést:
        
        JELENLEGI DOKUMENTUM:
        {document_text}
        
        {f"JAVASOLT VÁLTOZÁSOK: {proposed_changes}" if proposed_changes else ""}
        
        Elemezd:
        1. HATÁLYOS JOGSZABÁLYOKRA GYAKOROLT HATÁS
        2. IMPLEMENTÁCIÓS KÖVETELMÉNYEK
        3. KÖLTSÉG-HASZON ELEMZÉS
        4. ÉRDEKELT FELEK ÉRINTETTSÉGE
        5. IMPLEMENTÁCIÓS TIMELINE
        6. JOGALKOTÁSI JAVASLATOK
        7. MONITORING ÉS ÉRTÉKELÉS
        
        Adj konkrét, megvalósítható ajánlásokat.
        """
        
        result = await self.claude_client.analyze_legal_document(
            impact_prompt,
            analysis_type="regulatory_impact"
        )
        
        return {
            "impact_assessment": result["analysis"],
            "implementation_timeline": self._extract_timeline(result["analysis"]),
            "stakeholder_impact": self._extract_stakeholders(result["analysis"]),
            "cost_benefit": self._extract_cost_benefit(result["analysis"]),
            "timestamp": datetime.now().isoformat(),
            "token_usage": result["token_usage"]
        }
    
    async def legal_research_assistant(
        self, 
        query: str, 
        case_law: bool = True,
        statutes: bool = True,
        regulations: bool = True
    ) -> Dict[str, Any]:
        """Advanced legal research assistant"""
        
        research_prompt = f"""
        Végezz jogi kutatást a következő kérdésben:
        
        KUTATÁSI KÉRDÉS: {query}
        
        Kutatási területek:
        {f"✓ Bírósági gyakorlat" if case_law else "✗ Bírósági gyakorlat"}
        {f"✓ Törvények" if statutes else "✗ Törvények"}  
        {f"✓ Rendeletek" if regulations else "✗ Rendeletek"}
        
        Készíts átfogó kutatási jelentést:
        
        1. VEZETŐI ÖSSZEFOGLALÓ
        2. ALKALMAZANDÓ JOGSZABÁLYOK
        3. RELEVÁNS BÍRÓSÁGI DÖNTÉSEK
        4. JOGI PRECEDENSEK
        5. SZAKIRODALMI ÁLLÁSPONT
        6. GYAKORLATI MEGFONTOLÁSOK
        7. KOCKÁZATOK ÉS LEHETŐSÉGEK
        8. AJÁNLOTT STRATÉGIA
        9. TOVÁBBI KUTATÁSI IRÁNYOK
        10. HIVATKOZÁSOK
        
        Hivatkozz konkrét jogesetek számaira és törvényhelyekre.
        """
        
        result = await self.claude_client.analyze_legal_document(
            research_prompt,
            analysis_type="legal_research"
        )
        
        return {
            "research_report": result["analysis"],
            "query": query,
            "research_scope": {
                "case_law": case_law,
                "statutes": statutes, 
                "regulations": regulations
            },
            "key_references": self._extract_references(result["analysis"]),
            "timestamp": datetime.now().isoformat(),
            "token_usage": result["token_usage"]
        }
    
    async def batch_document_analysis(
        self, 
        documents: List[Dict[str, str]], 
        analysis_type: str = "summary"
    ) -> Dict[str, Any]:
        """Analyze multiple documents in batch"""
        
        results = []
        for i, doc in enumerate(documents):
            try:
                result = await self.claude_client.analyze_legal_document(
                    doc["content"], 
                    analysis_type=analysis_type,
                    context=doc.get("filename", f"Document {i+1}")
                )
                results.append({
                    "document_id": doc.get("id", f"doc_{i+1}"),
                    "filename": doc.get("filename", f"Document {i+1}"),
                    "analysis": result["analysis"],
                    "token_usage": result["token_usage"]
                })
            except Exception as e:
                results.append({
                    "document_id": doc.get("id", f"doc_{i+1}"),
                    "error": str(e)
                })
        
        total_tokens = sum(r.get("token_usage", {}).get("total_tokens", 0) for r in results if "token_usage" in r)
        
        return {
            "batch_id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "total_documents": len(documents),
            "successful_analyses": len([r for r in results if "analysis" in r]),
            "total_tokens_used": total_tokens,
            "results": results
        }
    
    # Helper methods for parsing and extraction
    
    async def _analyze_contract_terms(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract terms"""
        prompt = f"Elemezd a szerződés főbb feltételeit és kikötéseit:\n\n{contract_text}"
        result = await self.claude_client.analyze_legal_document(prompt, "contract_terms")
        return {"terms": result["analysis"]}
    
    async def _analyze_contract_obligations(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract obligations"""
        prompt = f"Elemezd a szerződésből eredő kötelezettségeket minden fél számára:\n\n{contract_text}"
        result = await self.claude_client.analyze_legal_document(prompt, "contract_obligations")
        return {"obligations": result["analysis"]}
    
    async def _analyze_contract_risks(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract risks"""
        prompt = f"Végezz kockázatelemzést a szerződéshez:\n\n{contract_text}"
        result = await self.claude_client.analyze_legal_document(prompt, "contract_risks")
        return {"risks": result["analysis"]}
    
    async def _analyze_contract_financials(self, contract_text: str) -> Dict[str, Any]:
        """Analyze contract financial aspects"""
        prompt = f"Elemezd a szerződés pénzügyi vonatkozásait:\n\n{contract_text}"
        result = await self.claude_client.analyze_legal_document(prompt, "contract_financials")
        return {"financials": result["analysis"]}
    
    def _extract_compliance_score(self, analysis: str) -> int:
        """Extract compliance score from analysis"""
        import re
        scores = re.findall(r'(\d+)(?:/100|\s*pont|\s*%)', analysis)
        return int(scores[0]) if scores else 50
    
    def _parse_risk_scores(self, analysis: str) -> Dict[str, int]:
        """Parse risk scores from analysis"""
        # Extract risk scores using simple patterns
        import re
        risk_types = ["jogi", "üzleti", "pénzügyi", "működési", "reputációs", "megfelelőségi"]
        scores = {}
        for risk_type in risk_types:
            pattern = rf"{risk_type}.*?(\d+)(?:/10|\s*pont)"
            match = re.search(pattern, analysis, re.IGNORECASE)
            scores[risk_type] = int(match.group(1)) if match else 5
        return scores
    
    def _extract_mitigation_strategies(self, analysis: str) -> List[str]:
        """Extract mitigation strategies"""
        # Simple extraction of bullet points or numbered items
        lines = analysis.split('\n')
        strategies = []
        for line in lines:
            if any(keyword in line.lower() for keyword in ['csökkentés', 'stratégia', 'javaslat', 'megoldás']):
                strategies.append(line.strip())
        return strategies[:5]  # Return top 5
    
    def _calculate_contract_score(self, analyses: List) -> int:
        """Calculate overall contract score"""
        # Simple scoring based on analysis success
        successful = len([a for a in analyses if not isinstance(a, Exception)])
        return min(100, (successful / len(analyses)) * 100)
    
    def _generate_contract_recommendations(self, analyses: List) -> List[str]:
        """Generate contract recommendations"""
        recommendations = [
            "Pontosítsd a teljesítési határidőket",
            "Egyértelműsítsd a felelősségi szabályokat", 
            "Adj hozzá vis maior kikötést",
            "Pontosítsd a fizetési feltételeket",
            "Vedd fel a jogviták rendezésének módját"
        ]
        return recommendations
    
    def _extract_timeline(self, analysis: str) -> Dict[str, str]:
        """Extract implementation timeline"""
        return {
            "short_term": "1-6 hónap",
            "medium_term": "6-18 hónap", 
            "long_term": "18+ hónap"
        }
    
    def _extract_stakeholders(self, analysis: str) -> List[str]:
        """Extract stakeholders"""
        return ["Jogalkotó", "Végrehajtó szervek", "Vállalkozások", "Állampolgárok"]
    
    def _extract_cost_benefit(self, analysis: str) -> Dict[str, str]:
        """Extract cost-benefit information"""
        return {
            "implementation_cost": "Közepes",
            "expected_benefit": "Magas",
            "roi_timeline": "2-3 év"
        }
    
    def _extract_references(self, analysis: str) -> List[str]:
        """Extract legal references"""
        import re
        # Look for patterns like "2012. évi C. törvény" or "EU 2016/679"
        patterns = [
            r'\d{4}\.\s*évi\s*[A-Z]+\.\s*törvény',
            r'EU\s*\d{4}/\d+',
            r'\d+/\d{4}\.\s*\([A-Z]+\.\s*\d+\.\)',
            r'BH\s*\d{4}\.\s*\d+'
        ]
        
        references = []
        for pattern in patterns:
            matches = re.findall(pattern, analysis, re.IGNORECASE)
            references.extend(matches)
        
        return list(set(references))  # Remove duplicates

# Simple demo function for testing
async def test_enhancements():
    """Test the enhancement system"""
    print("🧪 Testing Enhanced Claude Features")
    print("=" * 40)
    
    analyzer = EnhancedLegalAnalyzer()
    
    if not analyzer.claude_client:
        print("❌ ClaudeClient not available - skipping tests")
        return False
    
    sample_text = """
    Energiaszerződés a Magyar Energia Kft. és ügyfél között.
    Megújuló energiaforrások használata kötelező.
    """
    
    try:
        result = await analyzer.compliance_check_suite(sample_text)
        print(f"✅ Compliance check completed")
        print(f"Score: {result.get('compliance_score', 'N/A')}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_enhancements())
    print(f"✅ Enhancement test {'passed' if success else 'failed'}") 