import structlog
import json
import re
from typing import Any, Dict, Optional, List

from energia_ai.agents.base import BaseAgent, AgentResult, AgentConfig
from energia_ai.ai.claude_client import get_claude_client, ClaudeClient

logger = structlog.get_logger(__name__)


class TaskUnderstandingAgent(BaseAgent):
    """
    An agent specialized in parsing natural language queries into a structured,
    machine-readable execution plan with Hungarian legal terminology support.
    """

    def __init__(self, claude_client: ClaudeClient = None, config: Optional[AgentConfig] = None):
        self._claude_client = claude_client
        self._hungarian_legal_terms = self._load_hungarian_legal_terms()
        super().__init__(config)

    @property
    def agent_name(self) -> str:
        return "task_understanding_agent"

    @property
    def agent_description(self) -> str:
        return "Parses user queries to determine intent and create an execution plan with Hungarian legal terminology support."

    async def _get_client(self) -> ClaudeClient:
        if self._claude_client is None:
            self._claude_client = await get_claude_client()
        return self._claude_client

    def _load_hungarian_legal_terms(self) -> Dict[str, List[str]]:
        """Load Hungarian legal terminology patterns."""
        return {
            "energy_law": [
                "energiatörvény", "energia törvény", "villamos energia", "gáztörvény", "energiapolitika",
                "megújuló energia", "áramszolgáltatás", "gázszolgáltatás", "energiahatékonyság",
                "villamos mű", "energiatározás", "hálózathasználat"
            ],
            "contract_law": [
                "szerződés", "szerződéses", "megállapodás", "vállalkozási szerződés", "adásvételi szerződés",
                "szolgáltatási szerződés", "bérleti szerződés", "társasági szerződés"
            ],
            "administrative_law": [
                "közigazgatás", "hatósági", "engedély", "eljárás", "közigazgatási", "hatáskör",
                "illetékesség", "fellebbezés", "jogorvoslat"
            ],
            "environmental_law": [
                "környezetvédelem", "környezeti", "szennyezés", "hulladék", "emisszió", "természetvédelem",
                "védett terület", "környezeti hatásvizsgálat", "NATURA 2000"
            ],
            "tax_law": [
                "adó", "adózás", "áfa", "szja", "társasági adó", "helyi adó", "különadó", "adókötelezettség",
                "adóbevallás", "adótartozás"
            ]
        }

    def _classify_query_domain(self, query: str) -> List[str]:
        """Classify query into legal domains based on Hungarian terminology."""
        query_lower = query.lower()
        domains = []
        
        for domain, terms in self._hungarian_legal_terms.items():
            for term in terms:
                if term in query_lower:
                    domains.append(domain)
                    break
                    
        return domains if domains else ["general"]

    def _extract_legal_entities(self, query: str) -> List[Dict[str, str]]:
        """Extract Hungarian legal entities and references."""
        entities = []
        
        # Hungarian law patterns
        law_patterns = [
            r"(\d{4}\.\s*évi\s*[IVXLCDM]+\.\s*törvény)",  # 2007. évi LXXXVI. törvény
            r"(\d+/\d{4}\.\s*\([IVXLCDM]+\.\s*\d+\.\)\s*Korm\.\s*rendelet)",  # Government decree
            r"(\d+/\d{4}\.\s*\([IVXLCDM]+\.\s*\d+\.\)\s*[A-Z]+\s*rendelet)",  # Ministry decree
        ]
        
        for pattern in law_patterns:
            matches = re.findall(pattern, query, re.IGNORECASE)
            for match in matches:
                entities.append({
                    "type": "legal_reference",
                    "text": match,
                    "category": "hungarian_law"
                })
        
        # Court decision patterns
        court_patterns = [
            r"(Kúria\s*[A-Z]+\.\s*\d+)",  # Kúria Pfv.IV.21.456/2019
            r"(BH\s*\d{4}\.\s*\d+)",  # BH1992.345
            r"(EBH\s*\d{4}\.\s*[A-Z]\.\d+)",  # EBH2001.E.5
        ]
        
        for pattern in court_patterns:
            matches = re.findall(pattern, query, re.IGNORECASE)
            for match in matches:
                entities.append({
                    "type": "court_decision",
                    "text": match,
                    "category": "case_law"
                })
        
        return entities

    def _determine_task_complexity(self, query: str, domains: List[str], entities: List[Dict]) -> str:
        """Determine task complexity based on query characteristics."""
        complexity_score = 0
        
        # Multiple domains increase complexity
        complexity_score += len(domains) * 2
        
        # Legal entities increase complexity
        complexity_score += len(entities) * 3
        
        # Query length indicator
        if len(query.split()) > 20:
            complexity_score += 2
        
        # Specific complexity indicators
        complex_indicators = [
            "összehasonlít", "elemez", "értékel", "kapcsolat", "hatás", "következmény",
            "jogkövetkezmény", "felelősség", "kártérítés", "szerződésszegés"
        ]
        
        for indicator in complex_indicators:
            if indicator in query.lower():
                complexity_score += 3
                
        if complexity_score <= 5:
            return "simple"
        elif complexity_score <= 10:
            return "medium"
        else:
            return "complex"

    def _build_enhanced_prompt(self, query: str, domains: List[str], entities: List[Dict], complexity: str) -> str:
        """Build enhanced prompt with Hungarian legal context."""
        return f"""
You are a specialized Hungarian legal AI assistant responsible for parsing user requests into structured execution plans.

Analyze the following Hungarian legal query and break it down into a JSON object representing the execution plan.

Query Analysis:
- Detected Legal Domains: {', '.join(domains)}
- Legal Entities Found: {len(entities)} entities
- Complexity Level: {complexity}
- Legal Entities: {json.dumps(entities, ensure_ascii=False, indent=2) if entities else 'None'}

Available specialized agents:
- "information_retrieval_agent": Searches Hungarian legal documents (laws, decrees, court decisions)
- "document_analysis_agent": Analyzes content of specific legal documents in Hungarian
- "comparison_agent": Compares multiple Hungarian legal documents or provisions
- "citation_analysis_agent": Analyzes legal citations and cross-references
- "domain_expert_agent": Provides domain-specific expertise (energy, contract, admin, environmental, tax law)

User Query: "{query}"

Instructions:
1. Create a step-by-step execution plan
2. Consider Hungarian legal terminology and context
3. For complex queries, break into multiple coordinated steps
4. Include confidence scores for each step (0.0-1.0)
5. Specify the expected output format for each step

Generate a JSON object with this structure:
{{
  "plan": {{
    "query_analysis": {{
      "original_query": "{query}",
      "detected_domains": {domains},
      "legal_entities": {len(entities)},
      "complexity": "{complexity}",
      "confidence": 0.95
    }},
    "steps": [
      {{
        "step_id": 1,
        "agent": "information_retrieval_agent",
        "query": "specific search query",
        "expected_output": "description of expected result",
        "confidence": 0.9,
        "dependencies": []
      }}
    ],
    "expected_final_output": "description of final expected result",
    "estimated_execution_time": "estimated time in minutes"
  }}
}}

The output MUST be only the JSON object, with no other text.
"""

    async def _execute_internal(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """
        Enhanced internal execution with Hungarian legal analysis.
        """
        try:
            # Analyze query characteristics
            domains = self._classify_query_domain(query)
            entities = self._extract_legal_entities(query)
            complexity = self._determine_task_complexity(query, domains, entities)
            
            self.logger.info("Query analysis completed", 
                           domains=domains, 
                           entities_count=len(entities),
                           complexity=complexity)
            
            # Build enhanced prompt
            client = await self._get_client()
            prompt = self._build_enhanced_prompt(query, domains, entities, complexity)
            
            # Get LLM response
            response = await client.client.messages.create(
                model=client.model,
                max_tokens=2048,
                temperature=0.1,  # Lower temperature for more consistent parsing
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = response.content[0].text
            
            # Clean up and parse JSON response
            json_text = response_text.strip()
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]

            parsed_plan = json.loads(json_text)
            
            # Add analysis metadata to the result
            parsed_plan["plan"]["metadata"] = {
                "analysis_timestamp": "2025-01-27T10:00:00Z",
                "analyzer_version": "1.0",
                "hungarian_terms_detected": len([e for e in entities if e["category"] == "hungarian_law"]),
                "preprocessing_successful": True
            }
            
            self.logger.info("Query successfully parsed into execution plan", 
                           plan_steps=len(parsed_plan["plan"]["steps"]),
                           complexity=complexity)
            
            return AgentResult(
                status="completed", 
                output=parsed_plan,
                metadata={
                    "domains": domains,
                    "entities_found": len(entities),
                    "complexity": complexity,
                    "confidence": parsed_plan["plan"]["query_analysis"].get("confidence", 0.0)
                }
            )

        except json.JSONDecodeError as e:
            self.logger.error("Failed to parse LLM response as JSON", 
                            error=str(e), 
                            response_text=response_text[:200])
            return AgentResult(
                status="failed", 
                output=None, 
                error=f"JSON Decode Error: {e}",
                metadata={"raw_response": response_text[:500]}
            )
        except Exception as e:
            self.logger.error("Unexpected error during task understanding", error=str(e))
            return AgentResult(
                status="failed", 
                output=None, 
                error=str(e)
            ) 