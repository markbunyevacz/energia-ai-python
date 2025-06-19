"""
DSPy-alapú jogi AI agent rendszer
Energia AI projekt részére

Ez a modul implementálja a DSPy keretrendszert használó jogi AI agenseket,
amelyek strukturált és automatikusan optimalizálható módon dolgoznak.
"""

import dspy
import os
import logging
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

# Környezeti változók betöltése
load_dotenv()

# Naplózás beállítása
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DSPyConfig:
    """DSPy konfigurációs osztály"""
    model_name: str = 'openai/gpt-4o-mini'
    temperature: float = 0.7
    max_tokens: int = 1000
    api_key: str = os.getenv('OPENAI_API_KEY', '')
    use_local_model: bool = False
    ollama_base_url: str = 'http://localhost:11434'

class LegalSignatures:
    """Jogi AI rendszerhez készített DSPy signatures"""
    
    class LegalQASignature(dspy.Signature):
        """Jogi kérdések megválaszolása szakszerűen és pontosan."""
        question = dspy.InputField(desc="Jogi kérdés vagy probléma")
        legal_context = dspy.InputField(desc="Releváns jogi kontextus, jogszabályok")
        answer = dspy.OutputField(desc="Szakszerű jogi válasz hivatkozásokkal")
        confidence = dspy.OutputField(desc="Válasz megbízhatósága 1-10 skálán")
    
    class DocumentAnalysisSignature(dspy.Signature):
        """Jogi dokumentumok elemzése és összefoglalása."""
        document_text = dspy.InputField(desc="Elemzendő jogi dokumentum szövege")
        analysis_type = dspy.InputField(desc="Elemzés típusa (szerződés, jogszabály, határozat)")
        summary = dspy.OutputField(desc="Dokumentum összefoglalása")
        key_points = dspy.OutputField(desc="Főbb pontok és megállapítások")
        legal_implications = dspy.OutputField(desc="Jogi következmények és rizikók")
    
    class CitationSearchSignature(dspy.Signature):
        """Jogi hivatkozások keresése és validálása."""
        legal_text = dspy.InputField(desc="Jogi szöveg hivatkozásokkal")
        found_citations = dspy.OutputField(desc="Talált jogi hivatkozások listája")
        citation_validity = dspy.OutputField(desc="Hivatkozások érvényessége és pontossága")

class BaseLegalAgent(dspy.Module):
    """Alapvető jogi AI agent osztály"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__()
        self.config = config
        self._setup_llm()
        
    def _setup_llm(self):
        """LLM beállítása"""
        if self.config.use_local_model:
            lm = dspy.LM(
                model='ollama/llama2',
                api_base=self.config.ollama_base_url,
                temperature=self.config.temperature
            )
        else:
            lm = dspy.LM(
                model=self.config.model_name,
                api_key=self.config.api_key,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens
            )
        dspy.configure(lm=lm)

class LegalQAAgent(BaseLegalAgent):
    """Jogi kérdés-válasz agent"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__(config)
        self.qa_chain = dspy.ChainOfThought(LegalSignatures.LegalQASignature)
    
    def forward(self, question: str, legal_context: str = "") -> dspy.Prediction:
        """Jogi kérdés feldolgozása"""
        start_time = time.time()
        
        try:
            result = self.qa_chain(
                question=question,
                legal_context=legal_context
            )
            
            # Minőség ellenőrzés
            dspy.Assert(
                len(result.answer.strip()) > 10,
                "A válasz túl rövid, részletesebb magyarázat szükséges!"
            )
            
            dspy.Suggest(
                int(result.confidence) >= 7,
                "Alacsony megbízhatóság, további kutatás javasolható!"
            )
            
            processing_time = time.time() - start_time
            logger.info(f"QA feldolgozási idő: {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Hiba a QA feldolgozásban: {e}")
            return dspy.Prediction(
                answer="Hiba történt a kérdés feldolgozása során. Kérjük próbálja újra.",
                confidence="1"
            )

class DocumentAnalysisAgent(BaseLegalAgent):
    """Dokumentumelemző agent"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__(config)
        self.analyzer = dspy.ChainOfThought(LegalSignatures.DocumentAnalysisSignature)
    
    def forward(self, document_text: str, analysis_type: str = "általános") -> dspy.Prediction:
        """Dokumentum elemzése"""
        start_time = time.time()
        
        try:
            result = self.analyzer(
                document_text=document_text,
                analysis_type=analysis_type
            )
            
            # Elemzés minőség ellenőrzés
            dspy.Assert(
                len(result.summary) > 50,
                "Az összefoglalás túl rövid!"
            )
            
            dspy.Suggest(
                len(result.key_points.split(',')) >= 3,
                "Legalább 3 főbb pontot azonosítson!"
            )
            
            processing_time = time.time() - start_time
            logger.info(f"Dokumentumelemzés idő: {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Hiba a dokumentumelemzésben: {e}")
            return dspy.Prediction(
                summary="Hiba történt az elemzés során.",
                key_points="Nem sikerült azonosítani",
                legal_implications="Ismeretlen"
            )

class LegalResearchAgent(BaseLegalAgent):
    """Jogi kutatási agent eszközökkel"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__(config)
        
        # Kutatási eszközök
        self.tools = [
            self.search_hungarian_law,
            self.search_eu_law,
            self.search_case_law,
            self.validate_citation
        ]
        
        signature = dspy.Signature("research_query -> research_result")
        self.researcher = dspy.ReAct(
            signature,
            tools=self.tools,
            max_iters=5
        )
    
    def search_hungarian_law(self, query: str) -> str:
        """Magyar jogszabály keresés"""
        # Itt integrálható a valós jogszabály adatbázis
        return f"Magyar jogszabály keresés: {query} - [Példa eredmények]"
    
    def search_eu_law(self, query: str) -> str:
        """EU jog keresés"""
        return f"EU jogi források: {query} - [Példa EU eredmények]"
    
    def search_case_law(self, query: str) -> str:
        """Bírósági gyakorlat keresés"""
        return f"Bírósági döntések: {query} - [Példa ítéletek]"
    
    def validate_citation(self, citation: str) -> str:
        """Jogi hivatkozás validálás"""
        return f"Hivatkozás ellenőrzés: {citation} - Érvényes/Érvénytelen"
    
    def forward(self, research_query: str) -> dspy.Prediction:
        """Jogi kutatás végrehajtása"""
        try:
            result = self.researcher(research_query=research_query)
            logger.info(f"Kutatás befejezve: {research_query}")
            return result
        except Exception as e:
            logger.error(f"Kutatási hiba: {e}")
            return dspy.Prediction(research_result="Kutatási hiba történt")

class MultiAgentLegalSystem(dspy.Module):
    """Multi-agent jogi rendszer koordinátor"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__()
        self.config = config
        
        # Specialist agensek
        self.qa_agent = LegalQAAgent(config)
        self.doc_agent = DocumentAnalysisAgent(config)
        self.research_agent = LegalResearchAgent(config)
        
        # Router agent
        self.router = dspy.ChainOfThought(
            "task_description, available_agents -> best_agent, reasoning"
        )
        
        self.agents = {
            "qa": self.qa_agent,
            "document_analysis": self.doc_agent,
            "research": self.research_agent
        }
    
    def forward(self, task_description: str, **kwargs) -> dspy.Prediction:
        """Feladat továbbítása a megfelelő agenthez"""
        try:
            # Agent kiválasztása
            agent_list = ", ".join(self.agents.keys())
            routing = self.router(
                task_description=task_description,
                available_agents=agent_list
            )
            
            chosen_agent = routing.best_agent.lower().strip()
            logger.info(f"Kiválasztott agent: {chosen_agent}, indoklás: {routing.reasoning}")
            
            # Feladat végrehajtás
            if chosen_agent in self.agents:
                agent = self.agents[chosen_agent]
                
                if chosen_agent == "qa":
                    return agent(
                        question=task_description,
                        legal_context=kwargs.get("legal_context", "")
                    )
                elif chosen_agent == "document_analysis":
                    return agent(
                        document_text=kwargs.get("document_text", task_description),
                        analysis_type=kwargs.get("analysis_type", "általános")
                    )
                elif chosen_agent == "research":
                    return agent(research_query=task_description)
            
            # Fallback - QA agent
            return self.qa_agent(
                question=task_description,
                legal_context=kwargs.get("legal_context", "")
            )
            
        except Exception as e:
            logger.error(f"Multi-agent rendszer hiba: {e}")
            return dspy.Prediction(
                answer="Rendszerhiba történt",
                confidence="1"
            )

class LegalAgentOptimizer:
    """DSPy agent optimalizáló osztály"""
    
    def __init__(self, config: DSPyConfig):
        self.config = config
    
    def create_training_data(self) -> List[dspy.Example]:
        """Tréning adatok létrehozása"""
        return [
            dspy.Example(
                question="Mi a szerződés érvénytelensége?",
                legal_context="Ptk. 6:95. §",
                answer="A szerződés érvénytelen, ha jogszabályba ütközik vagy jogszabály által védett érdeket sért..."
            ),
            dspy.Example(
                question="Mikor alkalmazható a vis maior?",
                legal_context="Ptk. 6:142. §",
                answer="Vis maior esetén a kötelezett mentesül a felelősség alól, ha bizonyítja..."
            ),
            # További példák...
        ]
    
    def accuracy_metric(self, example, prediction, trace=None) -> float:
        """Pontosság metrika"""
        # Egyszerű string egyezés alapú metrika
        return 1.0 if any(
            keyword in prediction.answer.lower() 
            for keyword in example.answer.lower().split()[:3]
        ) else 0.0
    
    def optimize_agent(self, agent: dspy.Module) -> dspy.Module:
        """Agent optimalizálás"""
        from dspy.teleprompt import BootstrapFewShot
        
        trainset = self.create_training_data()
        
        teleprompter = BootstrapFewShot(
            metric=self.accuracy_metric,
            max_bootstrapped_demos=3
        )
        
        optimized_agent = teleprompter.compile(
            agent, 
            trainset=trainset
        )
        
        logger.info("Agent optimalizálás befejezve")
        return optimized_agent

# Használati példa és tesztelés
def main():
    """Fő tesztelési függvény"""
    config = DSPyConfig()
    
    # Multi-agent rendszer inicializálása
    legal_system = MultiAgentLegalSystem(config)
    
    # Példa kérdések
    test_cases = [
        {
            "task": "Mi a különbség a szerződés és a megállapodás között?",
            "type": "qa"
        },
        {
            "task": "Elemezd ezt a szerződést",
            "document_text": "Eladó és vevő megállapodnak...",
            "type": "document_analysis"
        },
        {
            "task": "Keress információt a GDPR magyar implementációjáról",
            "type": "research"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n=== Teszt eset {i} ===")
        print(f"Feladat: {test_case['task']}")
        
        try:
            result = legal_system(
                task_description=test_case['task'],
                **{k: v for k, v in test_case.items() if k not in ['task', 'type']}
            )
            print(f"Eredmény: {result}")
        except Exception as e:
            print(f"Hiba: {e}")

if __name__ == "__main__":
    main() 