# DSPy Implementációs Roadmap
## Energia AI Projekt - AI Agensek Jövőbeli Programozása

## 1. Projekt Áttekintés

### 1.1 Célkitűzés
DSPy (Declarative Self-improving Python) keretrendszer teljes integrálása az Energia AI jogi rendszerbe, modern, önoptimalizáló AI agensek fejlesztése céljából.

### 1.2 Jelenlegi Állapot
- ✅ Alapvető DSPy agensek implementálva (`dspy_legal_agents.py`)
- ✅ Multi-agent koordinátor rendszer
- ✅ Jogi specializált signatures
- 🔄 Integrációs pontok fejlesztés alatt

## 2. Fázisolt Implementációs Terv

### Fázis 1: Alapinfrastruktúra (1-2 hét)

#### 1.1 Környezet Beállítása
```bash
# DSPy telepítése
pip install dspy-ai

# Kiegészítő komponensek
pip install dspy-ai[chromadb]  # Vector database support
pip install ollama             # Local models
```

#### 1.2 Konfigurációs Rendszer
```python
# src/energia_ai/config/dspy_settings.py
from dataclasses import dataclass
from typing import Optional
import os

@dataclass
class DSPyEnvironmentConfig:
    """Környezet-specifikus DSPy konfigurációk"""
    environment: str
    model_name: str
    api_key: str
    temperature: float
    max_tokens: int
    use_local_model: bool = False
    cache_enabled: bool = True
    monitoring_enabled: bool = True

class DSPyConfigManager:
    """DSPy konfigurációk központi kezelése"""
    
    @staticmethod
    def get_config(env: str = "development") -> DSPyEnvironmentConfig:
        configs = {
            "development": DSPyEnvironmentConfig(
                environment="dev",
                model_name="openai/gpt-3.5-turbo",
                api_key=os.getenv("OPENAI_API_KEY"),
                temperature=0.7,
                max_tokens=500,
                use_local_model=True
            ),
            "staging": DSPyEnvironmentConfig(
                environment="staging", 
                model_name="openai/gpt-4o-mini",
                api_key=os.getenv("OPENAI_API_KEY"),
                temperature=0.5,
                max_tokens=1000
            ),
            "production": DSPyEnvironmentConfig(
                environment="prod",
                model_name="openai/gpt-4",
                api_key=os.getenv("OPENAI_API_KEY_PROD"),
                temperature=0.3,
                max_tokens=1500,
                monitoring_enabled=True
            )
        }
        return configs.get(env, configs["development"])
```

#### 1.3 Testing Framework
```python
# tests/agents/test_dspy_agents.py
import pytest
import dspy
from src.energia_ai.agents.dspy_legal_agents import LegalQAAgent, DSPyConfig

class TestDSPyAgents:
    
    @pytest.fixture
    def test_config(self):
        return DSPyConfig(
            model_name="openai/gpt-3.5-turbo",
            api_key="test-key",
            temperature=0.7
        )
    
    @pytest.fixture
    def qa_agent(self, test_config):
        return LegalQAAgent(test_config)
    
    def test_legal_qa_basic(self, qa_agent):
        """Alapvető QA tesztelés"""
        result = qa_agent(
            question="Mi a szerződés definíciója?",
            legal_context="Ptk. 6:59. §"
        )
        
        assert result.answer is not None
        assert len(result.answer) > 10
        assert result.confidence is not None
    
    def test_legal_qa_with_assertions(self, qa_agent):
        """Assertions tesztelése"""
        with pytest.raises(dspy.primitives.Assert):
            qa_agent(question="", legal_context="")
```

### Fázis 2: Specializált Agensek (2-3 hét)

#### 2.1 Szerződéselemző Agent
```python
# src/energia_ai/agents/specialized/contract_analysis_agent.py
import dspy
from typing import Dict, List
from ..dspy_legal_agents import BaseLegalAgent, DSPyConfig

class ContractSignatures:
    
    class ContractAnalysisSignature(dspy.Signature):
        """Szerződések átfogó elemzése és kockázatértékelése."""
        contract_text = dspy.InputField(desc="Teljes szerződés szövege")
        contract_type = dspy.InputField(desc="Szerződés típusa (adásvétel, bérleti, stb.)")
        analysis_focus = dspy.InputField(desc="Elemzés fókusza (kockázat, megfelelőség, stb.)")
        
        executive_summary = dspy.OutputField(desc="Vezetői összefoglaló")
        key_clauses = dspy.OutputField(desc="Kulcsfontosságú kikötések")
        risk_assessment = dspy.OutputField(desc="Kockázatelemzés 1-10 skálán")
        recommendations = dspy.OutputField(desc="Javaslatok és módosítási pontok")
        compliance_check = dspy.OutputField(desc="Jogszabályi megfelelőség ellenőrzés")

class ContractAnalysisAgent(BaseLegalAgent):
    """Szerződéselemző agent fejlett analitikai képességekkel"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__(config)
        self.analyzer = dspy.ChainOfThought(ContractSignatures.ContractAnalysisSignature)
        self.clause_extractor = dspy.Predict("contract_text -> important_clauses")
        
    def forward(self, contract_text: str, contract_type: str = "általános", 
                analysis_focus: str = "átfogó") -> dspy.Prediction:
        """Szerződés elemzése több lépcsős folyamattal"""
        
        # 1. lépés: Kulcsfontosságú kikötések kinyerése
        clauses = self.clause_extractor(contract_text=contract_text)
        
        # 2. lépés: Átfogó elemzés
        analysis = self.analyzer(
            contract_text=contract_text,
            contract_type=contract_type,
            analysis_focus=analysis_focus
        )
        
        # Minőségi ellenőrzések
        dspy.Assert(
            len(analysis.executive_summary) > 100,
            "A vezetői összefoglaló túl rövid!"
        )
        
        dspy.Assert(
            int(analysis.risk_assessment.split()[0]) <= 10,
            "A kockázati pontszám nem lehet 10-nél nagyobb!"
        )
        
        dspy.Suggest(
            "kockázat" in analysis.risk_assessment.lower(),
            "A kockázatelemzés részletesebb lehetne!"
        )
        
        # Eredmény kiegészítése
        analysis.extracted_clauses = clauses.important_clauses
        
        return analysis
```

#### 2.2 Compliance Agent
```python
# src/energia_ai/agents/specialized/compliance_agent.py
import dspy
from typing import List, Dict
from ..dspy_legal_agents import BaseLegalAgent

class ComplianceSignatures:
    
    class ComplianceCheckSignature(dspy.Signature):
        """Jogszabályi megfelelőség átfogó ellenőrzése."""
        document_text = dspy.InputField(desc="Ellenőrizendő dokumentum")
        applicable_laws = dspy.InputField(desc="Alkalmazandó jogszabályok listája")
        industry_sector = dspy.InputField(desc="Iparági szektor (energia, pénzügy, stb.)")
        
        compliance_status = dspy.OutputField(desc="Megfelelőségi státusz (megfelelő/részben/nem megfelelő)")
        violations_found = dspy.OutputField(desc="Talált jogszabálysértések listája")
        recommendations = dspy.OutputField(desc="Megfelelőségi javaslatok")
        priority_actions = dspy.OutputField(desc="Prioritásos teendők")

class ComplianceAgent(BaseLegalAgent):
    """Jogszabályi megfelelőség ellenőrző agent"""
    
    def __init__(self, config: DSPyConfig):
        super().__init__(config)
        self.compliance_checker = dspy.ChainOfThought(ComplianceSignatures.ComplianceCheckSignature)
        
        # Specialized compliance tools
        self.tools = [
            self.check_gdpr_compliance,
            self.check_energy_regulations,
            self.check_contract_law_compliance,
            self.check_tax_compliance
        ]
        
        # ReAct agent for tool usage
        signature = dspy.Signature("compliance_query, document_text -> detailed_compliance_report")
        self.compliance_researcher = dspy.ReAct(
            signature,
            tools=self.tools,
            max_iters=3
        )
    
    def check_gdpr_compliance(self, text: str) -> str:
        """GDPR megfelelőség ellenőrzés"""
        # Implement GDPR specific checks
        return f"GDPR elemzés: {text[:100]}... - Ellenőrzés eredménye"
    
    def check_energy_regulations(self, text: str) -> str:
        """Energetikai szabályozás ellenőrzés"""
        return f"Energetikai jogszabályok: {text[:100]}... - Megfelelőség státusz"
    
    def check_contract_law_compliance(self, text: str) -> str:
        """Szerződési jog megfelelőség"""
        return f"Ptk. szerződési rész: {text[:100]}... - Jogszabályi megfelelőség"
    
    def check_tax_compliance(self, text: str) -> str:
        """Adójogi megfelelőség"""
        return f"Adójogi előírások: {text[:100]}... - Adójogi státusz"
```

### Fázis 3: FastAPI Integráció (1 hét)

#### 3.1 DSPy Endpoints
```python
# src/energia_ai/api/ai/dspy_endpoints.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ...agents.dspy_legal_agents import MultiAgentLegalSystem, DSPyConfig
from ...agents.specialized.contract_analysis_agent import ContractAnalysisAgent
from ...config.dspy_settings import DSPyConfigManager

router = APIRouter(prefix="/api/v1/dspy", tags=["DSPy AI Agents"])

# Request/Response modell
class LegalQARequest(BaseModel):
    question: str 
    legal_context: Optional[str] = ""
    agent_type: Optional[str] = "qa"

class LegalQAResponse(BaseModel):
    answer: str
    confidence: str
    processing_time: float
    agent_used: str

class ContractAnalysisRequest(BaseModel):
    contract_text: str
    contract_type: Optional[str] = "általános"
    analysis_focus: Optional[str] = "átfogó"

class ContractAnalysisResponse(BaseModel):
    executive_summary: str
    key_clauses: str
    risk_assessment: str
    recommendations: str
    compliance_check: str

# Dependency injection
def get_dspy_system() -> MultiAgentLegalSystem:
    config = DSPyConfigManager.get_config("production")
    return MultiAgentLegalSystem(config)

def get_contract_agent() -> ContractAnalysisAgent:
    config = DSPyConfigManager.get_config("production") 
    return ContractAnalysisAgent(config)

# Endpoints
@router.post("/legal-qa", response_model=LegalQAResponse)
async def dspy_legal_qa(
    request: LegalQARequest,
    system: MultiAgentLegalSystem = Depends(get_dspy_system)
):
    """DSPy alapú jogi kérdés-válasz"""
    try:
        import time
        start_time = time.time()
        
        result = system(
            task_description=request.question,
            legal_context=request.legal_context
        )
        
        processing_time = time.time() - start_time
        
        return LegalQAResponse(
            answer=result.answer,
            confidence=getattr(result, 'confidence', '8'),
            processing_time=processing_time,
            agent_used=request.agent_type
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSPy processing error: {str(e)}")

@router.post("/contract-analysis", response_model=ContractAnalysisResponse) 
async def analyze_contract(
    request: ContractAnalysisRequest,
    agent: ContractAnalysisAgent = Depends(get_contract_agent)
):
    """Szerződéselemzés DSPy agent segítségével"""
    try:
        result = agent(
            contract_text=request.contract_text,
            contract_type=request.contract_type,
            analysis_focus=request.analysis_focus
        )
        
        return ContractAnalysisResponse(
            executive_summary=result.executive_summary,
            key_clauses=result.key_clauses,
            risk_assessment=result.risk_assessment,
            recommendations=result.recommendations,
            compliance_check=result.compliance_check
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract analysis error: {str(e)}")

@router.get("/health")
async def health_check():
    """DSPy rendszer health check"""
    return {"status": "healthy", "dspy_version": "0.3.0"}
```

### Fázis 4: Optimalizálás és Machine Learning (2-3 hét)

#### 4.1 Training Data Management
```python
# src/energia_ai/agents/optimization/training_data_manager.py
import dspy
from typing import List, Dict
import json
from pathlib import Path

class LegalTrainingDataManager:
    """Jogi tréning adatok kezelése és validálása"""
    
    def __init__(self, data_dir: Path = Path("data/training")):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def create_qa_training_data(self) -> List[dspy.Example]:
        """QA agent tréning adatok"""
        return [
            dspy.Example(
                question="Mi a szerződés érvénytelensége?",
                legal_context="Ptk. 6:95. § (1) Érvénytelen a szerződés, ha jogszabályba ütközik.",
                answer="A szerződés érvénytelen, ha jogszabályba ütközik vagy jogszabály által védett érdeket sért. Az érvénytelenség jogkövetkezményei a Ptk. 6:95. § szerint alakulnak.",
                confidence="9"
            ),
            dspy.Example(
                question="Mikor alkalmazható a vis maior?",
                legal_context="Ptk. 6:142. § A vis maior...",
                answer="Vis maior esetén a kötelezett mentesül a felelősség alól, ha bizonyítja, hogy a szerződésszegést elháríthatatlan külső ok okozta.",
                confidence="9"
            ),
            # További példák...
        ]
    
    def create_contract_analysis_data(self) -> List[dspy.Example]:
        """Szerződéselemzés tréning adatok"""
        return [
            dspy.Example(
                contract_text="Adásvételi szerződés: Az eladó átruházza...",
                contract_type="adásvételi",
                executive_summary="Standard adásvételi szerződés megfelelő jogi tartalommal.",
                key_clauses="Vételár: XXX Ft, Átadás-átvétel: YYY időpont",
                risk_assessment="3 - Alacsony kockázat",
                recommendations="Javaslatok: kellékszavatosság pontosítása"
            )
        ]
    
    def validate_training_data(self, examples: List[dspy.Example]) -> List[dspy.Example]:
        """Tréning adatok validálása"""
        validated = []
        for example in examples:
            # Validation logic
            if self._is_valid_example(example):
                validated.append(example)
        return validated
    
    def _is_valid_example(self, example: dspy.Example) -> bool:
        """Példa validálási logika"""
        # Implement validation rules
        return True
    
    def save_training_data(self, examples: List[dspy.Example], filename: str):
        """Tréning adatok mentése"""
        data = [example.toDict() for example in examples]
        with open(self.data_dir / filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def load_training_data(self, filename: str) -> List[dspy.Example]:
        """Tréning adatok betöltése"""
        with open(self.data_dir / filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return [dspy.Example(**item) for item in data]
```

#### 4.2 Automated Optimization
```python
# src/energia_ai/agents/optimization/auto_optimizer.py
import dspy
from dspy.teleprompt import BootstrapFewShot, MIPROv2
from typing import Dict, Any, List
import logging
from .training_data_manager import LegalTrainingDataManager

logger = logging.getLogger(__name__)

class DSPyAutoOptimizer:
    """Automatikus DSPy agent optimalizáló"""
    
    def __init__(self, training_manager: LegalTrainingDataManager):
        self.training_manager = training_manager
        self.optimization_history = []
    
    def legal_accuracy_metric(self, example: dspy.Example, prediction: dspy.Prediction, trace=None) -> float:
        """Jogi pontosság metrika"""
        
        # Keywords matching
        expected_keywords = set(example.answer.lower().split())
        predicted_keywords = set(prediction.answer.lower().split())
        keyword_overlap = len(expected_keywords & predicted_keywords) / len(expected_keywords | predicted_keywords)
        
        # Confidence weighting
        confidence_score = float(getattr(prediction, 'confidence', '5')) / 10.0
        
        # Combined score
        accuracy = (keyword_overlap * 0.7) + (confidence_score * 0.3)
        return accuracy
    
    def optimize_qa_agent(self, agent: dspy.Module, optimization_method: str = "bootstrap") -> dspy.Module:
        """QA agent optimalizálása"""
        
        # Training data betöltése
        trainset = self.training_manager.create_qa_training_data()
        
        if optimization_method == "bootstrap":
            teleprompter = BootstrapFewShot(
                metric=self.legal_accuracy_metric,
                max_bootstrapped_demos=5,
                max_labeled_demos=3
            )
        elif optimization_method == "mipro":
            teleprompter = MIPROv2(
                metric=self.legal_accuracy_metric,
                auto="medium",
                num_threads=2
            )
        else:
            raise ValueError(f"Unknown optimization method: {optimization_method}")
        
        logger.info(f"Starting optimization with {optimization_method}")
        
        # Optimalizálás futtatása
        optimized_agent = teleprompter.compile(
            agent,
            trainset=trainset,
            max_bootstrapped_demos=5
        )
        
        # Eredmény logolása
        self.optimization_history.append({
            "agent_type": "qa",
            "method": optimization_method,
            "training_size": len(trainset),
            "timestamp": str(pd.Timestamp.now())
        })
        
        logger.info("QA agent optimization completed")
        return optimized_agent
    
    def optimize_contract_agent(self, agent: dspy.Module) -> dspy.Module:
        """Szerződéselemző agent optimalizálása"""
        
        trainset = self.training_manager.create_contract_analysis_data()
        
        def contract_accuracy_metric(example, prediction, trace=None):
            # Contract-specific accuracy calculation
            summary_score = 1.0 if len(prediction.executive_summary) > 50 else 0.5
            risk_score = 1.0 if prediction.risk_assessment.isdigit() else 0.5
            return (summary_score + risk_score) / 2.0
        
        teleprompter = BootstrapFewShot(
            metric=contract_accuracy_metric,
            max_bootstrapped_demos=3
        )
        
        optimized_agent = teleprompter.compile(agent, trainset=trainset)
        
        logger.info("Contract agent optimization completed")
        return optimized_agent
    
    def continuous_optimization(self, agents: Dict[str, dspy.Module], interval_hours: int = 24):
        """Folyamatos optimalizálás ütemezése"""
        import schedule
        import time
        
        def optimize_all():
            for agent_name, agent in agents.items():
                if agent_name == "qa":
                    agents[agent_name] = self.optimize_qa_agent(agent)
                elif agent_name == "contract":
                    agents[agent_name] = self.optimize_contract_agent(agent)
        
        schedule.every(interval_hours).hours.do(optimize_all)
        
        while True:
            schedule.run_pending()
            time.sleep(3600)  # Check every hour
```

### Fázis 5: Production Deployment (1 hét)

#### 5.1 Docker Support
```dockerfile
# Dockerfile.dspy
FROM python:3.11-slim

WORKDIR /app

# DSPy dependencies
COPY requirements-dspy.txt .
RUN pip install -r requirements-dspy.txt

# Application code
COPY src/ ./src/
COPY data/ ./data/

# Environment variables
ENV PYTHONPATH=/app/src
ENV DSPY_ENVIRONMENT=production

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/dspy/health')"

EXPOSE 8000

CMD ["uvicorn", "src.energia_ai.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 5.2 Kubernetes Deployment
```yaml
# k8s/dspy-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: energia-ai-dspy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: energia-ai-dspy
  template:
    metadata:
      labels:
        app: energia-ai-dspy
    spec:
      containers:
      - name: dspy-api
        image: energia-ai/dspy:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai-key
        - name: DSPY_ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi" 
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/v1/dspy/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 3. Teljesítménymérés és Monitoring

### 3.1 Performance Metrics
```python
# src/energia_ai/agents/optimization/performance_monitor.py
import time
import logging
from typing import Dict, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PerformanceMetrics:
    agent_type: str
    response_time: float
    token_usage: int
    accuracy_score: float
    error_rate: float
    timestamp: datetime

class DSPyPerformanceMonitor:
    """DSPy agensek teljesítménymonitorozása"""
    
    def __init__(self):
        self.metrics_history = []
        self.logger = logging.getLogger(__name__)
    
    def track_agent_performance(self, agent_type: str, start_time: float, 
                              result: Any, error: bool = False) -> PerformanceMetrics:
        """Agent teljesítmény nyomon követése"""
        
        response_time = time.time() - start_time
        
        metrics = PerformanceMetrics(
            agent_type=agent_type,
            response_time=response_time,
            token_usage=self._estimate_token_usage(result),
            accuracy_score=self._calculate_accuracy(result),
            error_rate=1.0 if error else 0.0,
            timestamp=datetime.now()
        )
        
        self.metrics_history.append(metrics)
        self._log_metrics(metrics)
        
        return metrics
    
    def _estimate_token_usage(self, result: Any) -> int:
        """Token használat becslése"""
        if hasattr(result, 'answer'):
            return len(result.answer.split()) * 1.3  # Rough estimate
        return 0
    
    def _calculate_accuracy(self, result: Any) -> float:
        """Pontosság számítása"""
        if hasattr(result, 'confidence'):
            try:
                return float(result.confidence) / 10.0
            except:
                return 0.7  # Default
        return 0.7
    
    def _log_metrics(self, metrics: PerformanceMetrics):
        """Metrikák logolása"""
        self.logger.info(
            f"DSPy Performance - Agent: {metrics.agent_type}, "
            f"Response Time: {metrics.response_time:.2f}s, "
            f"Accuracy: {metrics.accuracy_score:.2f}"
        )
    
    def get_performance_summary(self, agent_type: str = None) -> Dict[str, Any]:
        """Teljesítmény összesítő"""
        
        if agent_type:
            relevant_metrics = [m for m in self.metrics_history if m.agent_type == agent_type]
        else:
            relevant_metrics = self.metrics_history
        
        if not relevant_metrics:
            return {}
        
        return {
            "total_requests": len(relevant_metrics),
            "avg_response_time": sum(m.response_time for m in relevant_metrics) / len(relevant_metrics),
            "avg_accuracy": sum(m.accuracy_score for m in relevant_metrics) / len(relevant_metrics),
            "error_rate": sum(m.error_rate for m in relevant_metrics) / len(relevant_metrics),
            "total_tokens": sum(m.token_usage for m in relevant_metrics)
        }
```

## 4. Következő Lépések

### 4.1 Azonnali Teendők
1. DSPy dependencies hozzáadása `requirements.txt`-hez
2. Meglévő `dspy_legal_agents.py` tesztelése
3. Fejlesztői environment beállítása
4. Első endpoint integráció FastAPI-ban

### 4.2 1 hónapos célok
1. Specializált agensek (Contract, Compliance) implementálása
2. Training data készítése magyar jogi példákból  
3. Automatikus optimalizálás bevezetése
4. Performance monitoring rendszer

### 4.3 3 hónapos vízió
1. Production deployment teljes CI/CD pipeline-nal
2. Continuous learning implementálása
3. Multi-modal capabilities (PDF processing)
4. Enterprise-grade monitoring és alerting

## 5. Kockázatok és Mitigáció

### 5.1 Technikai Kockázatok
- **OpenAI API límit**: Fallback local models (Ollama)
- **Performance issues**: Caching és optimization
- **Model hallucination**: Assertion és validation rendszerek

### 5.2 Üzleti Kockázatok  
- **Jogi felelősség**: Disclaimer és human oversight
- **Költségkontroll**: Token usage monitoring
- **Adoption**: User training és change management

---

**Roadmap verzió**: 1.0  
**Létrehozva**: 2024-12-21  
**Következő review**: 2025-01-15 