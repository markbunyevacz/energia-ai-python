"""
MTP Migration Plan és Eszközök
DSPy -> MTP átállás támogatása az Energia AI projektben

Ez a modul tartalmazza:
1. DSPy -> MTP konverziós eszközöket
2. Párhuzamos tesztelési keretrendszert
3. Performance benchmark eszközöket
4. Fokozatos migrációs stratégiát
"""

from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Callable
import time
import asyncio
from enum import Enum
import json
from pathlib import Path

class MigrationPhase(Enum):
    """Migrációs fázisok"""
    ANALYSIS = "analysis"
    PILOT = "pilot"
    HYBRID = "hybrid"
    MIGRATION = "migration"
    OPTIMIZATION = "optimization"

@dataclass
class ComponentAnalysis:
    """DSPy komponens elemzése MTP migráció szempontjából"""
    name: str
    complexity: str  # "low", "medium", "high"
    migration_priority: int  # 1-5
    estimated_effort_hours: int
    dependencies: List[str]
    mtp_equivalent_complexity: str
    expected_code_reduction: float  # percentage
    risks: List[str]
    benefits: List[str]

@dataclass
class BenchmarkResult:
    """Performance benchmark eredmények"""
    component_name: str
    dspy_metrics: Dict[str, float]
    mtp_metrics: Dict[str, float]
    improvement_ratio: Dict[str, float]
    cost_comparison: Dict[str, float]
    timestamp: str

class DSPyComponentAnalyzer:
    """DSPy komponensek elemzése MTP migrációhoz"""
    
    def __init__(self):
        self.components = {}
        self.analysis_results = []
    
    def analyze_dspy_module(self, module_path: str, module_code: str) -> ComponentAnalysis:
        """DSPy modul elemzése"""
        
        # Kód komplexitás elemzése
        lines = module_code.split('\n')
        total_lines = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
        
        # DSPy specifikus elemek keresése
        has_signatures = 'dspy.Signature' in module_code
        has_modules = 'dspy.Module' in module_code
        has_chain_of_thought = 'ChainOfThought' in module_code
        has_react = 'ReAct' in module_code
        has_assertions = 'dspy.Assert' in module_code
        
        # Komplexitás meghatározása
        complexity_score = 0
        if has_signatures: complexity_score += 2
        if has_modules: complexity_score += 2
        if has_chain_of_thought: complexity_score += 1
        if has_react: complexity_score += 3
        if has_assertions: complexity_score += 1
        
        complexity = "low" if complexity_score <= 3 else "medium" if complexity_score <= 6 else "high"
        
        # MTP-ben várható kódcsökkentés
        expected_reduction = self._estimate_code_reduction(complexity_score, total_lines)
        
        # Migrációs prioritás (egyszerűbb komponensek előbb)
        priority = 5 - min(complexity_score, 4)
        
        return ComponentAnalysis(
            name=Path(module_path).stem,
            complexity=complexity,
            migration_priority=priority,
            estimated_effort_hours=self._estimate_migration_effort(complexity_score, total_lines),
            dependencies=self._extract_dependencies(module_code),
            mtp_equivalent_complexity="low",  # MTP általában egyszerűbb
            expected_code_reduction=expected_reduction,
            risks=self._identify_migration_risks(module_code),
            benefits=self._identify_migration_benefits(expected_reduction)
        )
    
    def _estimate_code_reduction(self, complexity_score: int, total_lines: int) -> float:
        """Várható kódcsökkentés becslése"""
        base_reduction = 0.6  # 60% alapértelmezett csökkentés
        complexity_factor = complexity_score * 0.05  # bonyolultabb kód nagyobb csökkentés
        return min(base_reduction + complexity_factor, 0.9)  # max 90%
    
    def _estimate_migration_effort(self, complexity_score: int, total_lines: int) -> int:
        """Migrációs erőfeszítés becslése órában"""
        base_hours = max(total_lines // 10, 4)  # min 4 óra
        complexity_multiplier = 1 + (complexity_score * 0.2)
        return int(base_hours * complexity_multiplier)
    
    def _extract_dependencies(self, code: str) -> List[str]:
        """Függőségek kinyerése"""
        dependencies = []
        lines = code.split('\n')
        for line in lines:
            if 'import' in line and 'dspy' in line:
                dependencies.append(line.strip())
        return dependencies
    
    def _identify_migration_risks(self, code: str) -> List[str]:
        """Migrációs kockázatok azonosítása"""
        risks = []
        
        if 'dspy.Assert' in code:
            risks.append("Assertion logika átírása szükséges")
        if 'ReAct' in code:
            risks.append("ReAct tool integration újragondolása")
        if 'teleprompt' in code:
            risks.append("Optimalizálási mechanizmus lecserélése")
        if 'Signature' in code and code.count('class') > 3:
            risks.append("Komplex signature hierarchia")
            
        return risks
    
    def _identify_migration_benefits(self, code_reduction: float) -> List[str]:
        """Migrációs előnyök azonosítása"""
        benefits = [
            f"{code_reduction*100:.0f}% kódcsökkentés várható",
            "Automatikus prompt optimalizálás",
            "Egyszerűbb karbantartás",
            "Jobb típusbiztonság"
        ]
        
        if code_reduction > 0.7:
            benefits.append("Jelentős fejlesztési idő megtakarítás")
        if code_reduction > 0.8:
            benefits.append("Dramatikus kód egyszerűsítés")
            
        return benefits

class MTPerformanceBenchmark:
    """MTP vs DSPy performance összehasonlító"""
    
    def __init__(self):
        self.results = []
    
    async def benchmark_component(self, 
                                component_name: str,
                                dspy_implementation: Callable,
                                mtp_implementation: Callable,
                                test_cases: List[Dict[str, Any]]) -> BenchmarkResult:
        """Komponens teljesítmény összehasonlítás"""
        
        print(f"Benchmarking {component_name}...")
        
        # DSPy teljesítménymérés
        dspy_metrics = await self._measure_performance(
            "DSPy", dspy_implementation, test_cases
        )
        
        # MTP teljesítménymérés
        mtp_metrics = await self._measure_performance(
            "MTP", mtp_implementation, test_cases
        )
        
        # Javulási arányok számítása
        improvement_ratio = {}
        for metric in dspy_metrics:
            if metric in mtp_metrics and dspy_metrics[metric] > 0:
                improvement_ratio[metric] = mtp_metrics[metric] / dspy_metrics[metric]
        
        # Költség összehasonlítás (becsült)
        cost_comparison = {
            "dspy_estimated_cost": dspy_metrics.get('total_tokens', 0) * 0.00002,  # $0.02/1K tokens
            "mtp_estimated_cost": mtp_metrics.get('total_tokens', 0) * 0.00002,
            "cost_savings_ratio": improvement_ratio.get('total_tokens', 1.0)
        }
        
        result = BenchmarkResult(
            component_name=component_name,
            dspy_metrics=dspy_metrics,
            mtp_metrics=mtp_metrics,
            improvement_ratio=improvement_ratio,
            cost_comparison=cost_comparison,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        self.results.append(result)
        return result
    
    async def _measure_performance(self, 
                                 framework: str,
                                 implementation: Callable,
                                 test_cases: List[Dict]) -> Dict[str, float]:
        """Teljesítmény mérése"""
        
        metrics = {
            "avg_response_time": 0.0,
            "total_requests": len(test_cases),
            "success_rate": 0.0,
            "total_tokens": 0,
            "avg_tokens_per_request": 0.0,
            "errors": 0
        }
        
        total_time = 0.0
        successful_requests = 0
        total_tokens = 0
        
        for test_case in test_cases:
            try:
                start_time = time.time()
                
                # Implementation futtatása
                result = await self._run_implementation(implementation, test_case)
                
                end_time = time.time()
                request_time = end_time - start_time
                
                total_time += request_time
                successful_requests += 1
                
                # Token becslés (egyszerű heurisztika)
                if hasattr(result, 'answer'):
                    tokens = len(str(result.answer).split()) * 1.3
                elif isinstance(result, str):
                    tokens = len(result.split()) * 1.3
                else:
                    tokens = len(str(result).split()) * 1.3
                
                total_tokens += tokens
                
            except Exception as e:
                print(f"Error in {framework}: {e}")
                metrics["errors"] += 1
        
        if successful_requests > 0:
            metrics["avg_response_time"] = total_time / successful_requests
            metrics["success_rate"] = successful_requests / len(test_cases)
            metrics["total_tokens"] = total_tokens
            metrics["avg_tokens_per_request"] = total_tokens / successful_requests
        
        return metrics
    
    async def _run_implementation(self, implementation: Callable, test_case: Dict) -> Any:
        """Implementation futtatása"""
        if asyncio.iscoroutinefunction(implementation):
            return await implementation(**test_case)
        else:
            return implementation(**test_case)
    
    def generate_benchmark_report(self) -> str:
        """Benchmark riport generálása"""
        if not self.results:
            return "Nincs benchmark adat."
        
        report = "# MTP vs DSPy Performance Benchmark Report\n\n"
        
        for result in self.results:
            report += f"## {result.component_name}\n\n"
            
            # Teljesítmény táblázat
            report += "| Metrika | DSPy | MTP | Javulás |\n"
            report += "|---------|------|-----|----------|\n"
            
            for metric, dspy_value in result.dspy_metrics.items():
                mtp_value = result.mtp_metrics.get(metric, 0)
                improvement = result.improvement_ratio.get(metric, 0)
                
                if 'time' in metric:
                    report += f"| {metric} | {dspy_value:.3f}s | {mtp_value:.3f}s | {improvement:.2f}x |\n"
                elif 'rate' in metric:
                    report += f"| {metric} | {dspy_value:.1%} | {mtp_value:.1%} | {improvement:.2f}x |\n"
                else:
                    report += f"| {metric} | {dspy_value:.0f} | {mtp_value:.0f} | {improvement:.2f}x |\n"
            
            # Költség összehasonlítás
            report += f"\n**Becsült költségek:**\n"
            report += f"- DSPy: ${result.cost_comparison['dspy_estimated_cost']:.4f}\n"
            report += f"- MTP: ${result.cost_comparison['mtp_estimated_cost']:.4f}\n"
            report += f"- Megtakarítás: {(1 - result.cost_comparison['cost_savings_ratio']) * 100:.1f}%\n\n"
        
        return report

class MigrationOrchestrator:
    """Migrációs folyamat koordinálása"""
    
    def __init__(self):
        self.analyzer = DSPyComponentAnalyzer()
        self.benchmark = MTPerformanceBenchmark()
        self.migration_plan = []
        self.current_phase = MigrationPhase.ANALYSIS
    
    def create_migration_plan(self, dspy_components: List[str]) -> List[ComponentAnalysis]:
        """Teljes migrációs terv létrehozása"""
        
        print(f"Elemzés indítása {len(dspy_components)} komponensre...")
        
        # Komponensek elemzése
        analyses = []
        for component_path in dspy_components:
            try:
                with open(component_path, 'r', encoding='utf-8') as f:
                    code = f.read()
                
                analysis = self.analyzer.analyze_dspy_module(component_path, code)
                analyses.append(analysis)
                
            except Exception as e:
                print(f"Hiba {component_path} elemzésében: {e}")
        
        # Prioritás szerint rendezés
        analyses.sort(key=lambda x: (-x.migration_priority, x.complexity))
        
        self.migration_plan = analyses
        return analyses
    
    def generate_migration_phases(self) -> Dict[MigrationPhase, List[ComponentAnalysis]]:
        """Migrációs fázisok generálása"""
        
        phases = {
            MigrationPhase.PILOT: [],
            MigrationPhase.HYBRID: [],
            MigrationPhase.MIGRATION: [],
            MigrationPhase.OPTIMIZATION: []
        }
        
        for analysis in self.migration_plan:
            if analysis.migration_priority >= 4 and analysis.complexity == "low":
                phases[MigrationPhase.PILOT].append(analysis)
            elif analysis.migration_priority >= 3:
                phases[MigrationPhase.HYBRID].append(analysis)
            elif analysis.complexity != "high":
                phases[MigrationPhase.MIGRATION].append(analysis)
            else:
                phases[MigrationPhase.OPTIMIZATION].append(analysis)
        
        return phases
    
    def estimate_total_effort(self) -> Dict[str, int]:
        """Teljes erőfeszítés becslése"""
        
        total_hours = sum(a.estimated_effort_hours for a in self.migration_plan)
        
        return {
            "total_development_hours": total_hours,
            "total_weeks": total_hours // 40,  # 40 óra/hét
            "parallel_development_weeks": total_hours // 120,  # 3 fejlesztő párhuzamosan
            "estimated_cost": total_hours * 120  # $120/óra
        }
    
    def generate_migration_report(self) -> str:
        """Teljes migrációs riport"""
        
        if not self.migration_plan:
            return "Nincs migrációs terv."
        
        report = "# DSPy -> MTP Migrációs Terv\n\n"
        
        # Összesítő
        effort = self.estimate_total_effort()
        total_reduction = sum(a.expected_code_reduction for a in self.migration_plan) / len(self.migration_plan)
        
        report += f"## Összesítő\n\n"
        report += f"- **Komponensek száma**: {len(self.migration_plan)}\n"
        report += f"- **Becsült fejlesztési idő**: {effort['total_development_hours']} óra ({effort['total_weeks']} hét)\n"
        report += f"- **Párhuzamos fejlesztéssel**: {effort['parallel_development_weeks']} hét\n"
        report += f"- **Becsült költség**: ${effort['estimated_cost']:,}\n"
        report += f"- **Átlagos kódcsökkentés**: {total_reduction*100:.1f}%\n\n"
        
        # Fázisok
        phases = self.generate_migration_phases()
        
        for phase, components in phases.items():
            if not components:
                continue
                
            report += f"## {phase.value.title()} Fázis\n\n"
            
            for comp in components:
                report += f"### {comp.name}\n"
                report += f"- **Komplexitás**: {comp.complexity}\n"
                report += f"- **Prioritás**: {comp.migration_priority}/5\n"
                report += f"- **Becsült idő**: {comp.estimated_effort_hours} óra\n"
                report += f"- **Várható kódcsökkentés**: {comp.expected_code_reduction*100:.1f}%\n"
                
                if comp.risks:
                    report += f"- **Kockázatok**: {', '.join(comp.risks)}\n"
                if comp.benefits:
                    report += f"- **Előnyök**: {', '.join(comp.benefits)}\n"
                report += "\n"
        
        return report
    
    def save_migration_plan(self, output_path: str):
        """Migrációs terv mentése"""
        
        plan_data = {
            "migration_plan": [
                {
                    "name": a.name,
                    "complexity": a.complexity,
                    "priority": a.migration_priority,
                    "effort_hours": a.estimated_effort_hours,
                    "code_reduction": a.expected_code_reduction,
                    "risks": a.risks,
                    "benefits": a.benefits
                }
                for a in self.migration_plan
            ],
            "effort_estimation": self.estimate_total_effort(),
            "phases": {
                phase.value: [comp.name for comp in components]
                for phase, components in self.generate_migration_phases().items()
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(plan_data, f, indent=2, ensure_ascii=False)
        
        print(f"Migrációs terv mentve: {output_path}")

# Példa használat és teszt szkriptek
def example_usage():
    """Példa használat demonstrálása"""
    
    # Migrációs orchestrator inicializálása
    orchestrator = MigrationOrchestrator()
    
    # DSPy komponensek listája (példa)
    dspy_components = [
        "src/energia_ai/agents/dspy_legal_agents.py",
        # További komponensek...
    ]
    
    # 1. Migrációs terv létrehozása
    print("=== Migrációs Terv Létrehozása ===")
    migration_plan = orchestrator.create_migration_plan(dspy_components)
    print(f"Elemzett komponensek: {len(migration_plan)}")
    
    # 2. Migrációs riport generálása
    print("\n=== Migrációs Riport ===")
    report = orchestrator.generate_migration_report()
    print(report)
    
    # 3. Terv mentése
    orchestrator.save_migration_plan("migration_plan.json")

if __name__ == "__main__":
    example_usage() 