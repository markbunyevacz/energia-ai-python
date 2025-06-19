#!/usr/bin/env python3
"""
MTP Setup Script for Energia AI
Automatic setup for Meaning-Typed Programming environment

Usage:
    python scripts/mtp_setup.py --install    # Full MTP installation
    python scripts/mtp_setup.py --verify     # Verify installation
    python scripts/mtp_setup.py --demo       # Run demo
"""

import subprocess
import sys
import os
import tempfile
from pathlib import Path
import json
import time

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'
    BOLD = '\033[1m'

class MTPSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        
    def log(self, message: str, level: str = "info"):
        """Colored logging"""
        color_map = {
            "success": Colors.GREEN,
            "error": Colors.RED,
            "info": Colors.BLUE,
            "warning": Colors.YELLOW
        }
        color = color_map.get(level, Colors.BLUE)
        timestamp = time.strftime("%H:%M:%S")
        print(f"{color}[{timestamp}] {message}{Colors.END}")
    
    def run_command(self, command: str, description: str, check=True) -> bool:
        """Execute command with error handling"""
        self.log(f"Executing: {description}")
        
        try:
            result = subprocess.run(
                command.split() if isinstance(command, str) else command,
                capture_output=True,
                text=True,
                cwd=self.project_root,
                check=check
            )
            
            if result.returncode == 0:
                self.log(f"✓ {description} successful", "success")
                if result.stdout.strip():
                    print(f"   Output: {result.stdout.strip()}")
                return True
            else:
                self.log(f"✗ {description} failed", "error")
                if result.stderr.strip():
                    print(f"   Error: {result.stderr.strip()}")
                return False
                
        except subprocess.CalledProcessError as e:
            self.log(f"✗ {description} failed: {e}", "error")
            return False
        except Exception as e:
            self.log(f"✗ Unexpected error in {description}: {e}", "error")
            return False
    
    def check_python_version(self) -> bool:
        """Check Python version compatibility"""
        version = sys.version_info
        required_major, required_minor = 3, 9
        
        if version.major >= required_major and version.minor >= required_minor:
            self.log(f"✓ Python {version.major}.{version.minor}.{version.micro} is compatible", "success")
            return True
        else:
            self.log(f"✗ Python {version.major}.{version.minor} is too old, requires 3.9+", "error")
            return False
    
    def install_jac_language(self) -> bool:
        """Install Jac language and MTP components"""
        self.log("Installing Jac language and MTP components...")
        
        packages = [
            ("jaclang", "Jac language core"),
            ("mtllm", "MTP LLM integration"),
        ]
        
        for package, description in packages:
            if not self.run_command(f"pip install -U {package}", f"Installing {description}"):
                return False
        
        return True
    
    def verify_jac_installation(self) -> bool:
        """Verify Jac installation"""
        self.log("Verifying Jac installation...")
        
        # Check Jac version
        if not self.run_command("jac --version", "Checking Jac version", check=False):
            return False
        
        # Create and run test Jac file
        test_content = '''
walker main {
    print("MTP Setup Test - Success!");
    print("Jac language is working correctly.");
}
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jac', delete=False) as f:
            f.write(test_content)
            temp_path = f.name
        
        try:
            success = self.run_command(f"jac run {temp_path}", "Running Jac test file")
            os.unlink(temp_path)
            return success
        except Exception as e:
            self.log(f"Test file execution error: {e}", "error")
            try:
                os.unlink(temp_path)
            except:
                pass
            return False
    
    def create_mtp_demo(self) -> bool:
        """Create MTP demonstration files"""
        self.log("Creating MTP demonstration files...")
        
        demo_dir = self.project_root / "mtp_demo"
        demo_dir.mkdir(exist_ok=True)
        
        # Simple Legal QA Demo
        qa_demo_content = '''
// MTP Legal QA Demo for Energia AI
import { OpenAI } from "mtllm";

// Configure LLM
global llm = OpenAI(model_name="gpt-3.5-turbo", temperature=0.3);

// MTP function with automatic prompt optimization
can legal_qa(question: str, context: str = "") -> str by llm;

walker main {
    print("=== MTP Legal QA Demo ===");
    print("");
    
    // Demo questions
    questions = [
        "Mi a szerződés definíciója a magyar jogban?",
        "Mikor válik érvénytelenné egy szerződés?",
        "Mi a különbség a jogszabály és a rendelet között?"
    ];
    
    context = "Magyar Polgári Törvénykönyv (Ptk.) kontextusában";
    
    for question in questions {
        print(f"Kérdés: {question}");
        
        try {
            answer = legal_qa(question, context);
            print(f"Válasz: {answer}");
        } catch Exception as e {
            print(f"Hiba: {e}");
        }
        
        print("-" * 60);
    }
    
    print("MTP Demo befejezve!");
}
'''
        
        # Contract Analysis Demo
        contract_demo_content = '''
// MTP Contract Analysis Demo
import { OpenAI } from "mtllm";

global llm = OpenAI(model_name="gpt-4o-mini");

// Complex object type for contract analysis
obj ContractAnalysis {
    str summary;
    list[str] parties;
    list[str] key_terms;
    int risk_score;  // 1-10
    list[str] recommendations;
}

// MTP function returning complex object
can analyze_contract(
    contract_text: str, 
    contract_type: str = "general"
) -> ContractAnalysis by llm;

walker main {
    print("=== MTP Contract Analysis Demo ===");
    
    sample_contract = """
    ADÁSVÉTELI SZERZŐDÉS
    
    Eladó: ABC Korlátolt Felelősségű Társaság
    Székhely: 1111 Budapest, Példa utca 1.
    
    Vevő: XYZ Zártkörűen Működő Részvénytársaság  
    Székhely: 2222 Debrecen, Minta tér 5.
    
    Szerződés tárgya: Irodai bútorok értékesítése
    Vételár: 1.500.000 Ft + ÁFA
    Fizetési feltételek: 30 napos fizetési határidő
    Teljesítés: 2024. december 31-ig
    
    A felek a szerződést elolvasás és értelmezés után írják alá.
    """;
    
    try {
        print("Szerződés elemzése folyamatban...");
        analysis = analyze_contract(sample_contract, "adásvételi");
        
        print(f"Összefoglaló: {analysis.summary}");
        print(f"Felek: {', '.join(analysis.parties)}");
        print(f"Kockázati pontszám: {analysis.risk_score}/10");
        print("Javaslatok:");
        for rec in analysis.recommendations {
            print(f"  • {rec}");
        }
        
    } catch Exception as e {
        print(f"Elemzési hiba: {e}");
    }
}
'''
        
        try:
            # Write demo files
            (demo_dir / "legal_qa_demo.jac").write_text(qa_demo_content, encoding='utf-8')
            (demo_dir / "contract_demo.jac").write_text(contract_demo_content, encoding='utf-8')
            
            # Create README
            readme_content = """# MTP Demo Files - Energia AI

## Futtatás

```bash
# Jogi kérdés-válasz demo
jac run mtp_demo/legal_qa_demo.jac

# Szerződéselemzés demo
jac run mtp_demo/contract_demo.jac
```

## Előfeltételek

1. OpenAI API kulcs beállítása:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. Internet kapcsolat (LLM API hívásokhoz)

## MTP Előnyök a DSPy-hez képest

- **5.3× kevesebb kód**: Egyszerűbb implementáció
- **4.75× gyorsabb**: Optimalizált futásidő  
- **4.5× olcsóbb**: Token hatékonyság
- **Automatikus prompt optimalizálás**: Nincs manual engineering
- **Típusbiztonság**: Automatikus típus konverzió

## Troubleshooting

- Ha `jac: command not found` hibaüzenet: `pip install jaclang`
- Ha API hiba: Ellenőrizd az OPENAI_API_KEY változót
- Ha slow response: Első futtatás lassabb lehet (model loading)
"""
            
            (demo_dir / "README.md").write_text(readme_content, encoding='utf-8')
            
            self.log(f"✓ Demo files created in {demo_dir}", "success")
            return True
            
        except Exception as e:
            self.log(f"Demo creation error: {e}", "error")
            return False
    
    def run_demo(self) -> bool:
        """Run MTP demonstration"""
        demo_dir = self.project_root / "mtp_demo"
        
        if not demo_dir.exists():
            self.log("Demo files not found. Run --install first.", "error")
            return False
        
        # Check API key
        if not os.getenv('OPENAI_API_KEY'):
            self.log("OPENAI_API_KEY environment variable not set!", "error")
            self.log("Set it with: export OPENAI_API_KEY='your-key'", "info")
            return False
        
        self.log("Running MTP demonstrations...")
        
        # Run Legal QA demo
        qa_demo = demo_dir / "legal_qa_demo.jac"
        if qa_demo.exists():
            self.log("Running Legal QA demo...")
            if not self.run_command(f"jac run {qa_demo}", "Legal QA demo execution"):
                return False
        
        self.log("✓ MTP demo completed successfully!", "success")
        return True
    
    def install_requirements(self) -> bool:
        """Install MTP requirements"""
        req_file = self.project_root / "requirements-mtp.txt"
        
        if req_file.exists():
            return self.run_command(
                f"pip install -r {req_file}",
                "Installing MTP requirements"
            )
        else:
            self.log("requirements-mtp.txt not found, skipping", "warning")
            return True
    
    def create_vscode_config(self) -> bool:
        """Create VS Code configuration for Jac"""
        self.log("Setting up VS Code configuration...")
        
        vscode_dir = self.project_root / ".vscode"
        vscode_dir.mkdir(exist_ok=True)
        
        # Extensions recommendations
        extensions_config = {
            "recommendations": [
                "jaseci-labs.jaclang-extension",
                "ms-python.python",
                "ms-python.pylint"
            ]
        }
        
        # Settings for Jac development
        settings_config = {
            "files.associations": {
                "*.jac": "jac"
            },
            "jac.languageServer.enable": True,
            "editor.formatOnSave": True
        }
        
        try:
            with open(vscode_dir / "extensions.json", 'w') as f:
                json.dump(extensions_config, f, indent=2)
            
            with open(vscode_dir / "settings.json", 'w') as f:
                json.dump(settings_config, f, indent=2)
            
            self.log("✓ VS Code configuration created", "success")
            self.log("Install Jac extension: code --install-extension jaseci-labs.jaclang-extension", "info")
            return True
            
        except Exception as e:
            self.log(f"VS Code config error: {e}", "error")
            return False
    
    def generate_report(self) -> dict:
        """Generate installation status report"""
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "project_root": str(self.project_root),
            "components": {},
            "recommendations": []
        }
        
        # Check Jac installation
        try:
            result = subprocess.run(["jac", "--version"], capture_output=True, text=True)
            report["components"]["jac_installed"] = result.returncode == 0
            if result.returncode == 0:
                report["components"]["jac_version"] = result.stdout.strip()
        except:
            report["components"]["jac_installed"] = False
            report["recommendations"].append("Install Jac language: pip install jaclang")
        
        # Check MTLLM
        try:
            import mtllm
            report["components"]["mtllm_installed"] = True
            report["components"]["mtllm_version"] = getattr(mtllm, '__version__', 'unknown')
        except ImportError:
            report["components"]["mtllm_installed"] = False
            report["recommendations"].append("Install MTLLM: pip install mtllm")
        
        # Check demo files
        demo_dir = self.project_root / "mtp_demo"
        report["components"]["demo_files_exist"] = demo_dir.exists()
        
        # Check API key
        report["components"]["api_key_configured"] = bool(os.getenv('OPENAI_API_KEY'))
        if not report["components"]["api_key_configured"]:
            report["recommendations"].append("Set OPENAI_API_KEY environment variable")
        
        # Overall status
        all_components = [
            report["components"]["jac_installed"],
            report["components"]["mtllm_installed"],
            report["components"]["demo_files_exist"]
        ]
        report["setup_complete"] = all(all_components)
        
        return report

def main():
    """Main CLI interface"""
    setup = MTPSetup()
    
    if len(sys.argv) < 2:
        print(f"{Colors.BOLD}MTP Setup Tool - Energia AI{Colors.END}")
        print(f"{Colors.BLUE}Usage:{Colors.END}")
        print(f"  python scripts/mtp_setup.py --install    # Full MTP installation")
        print(f"  python scripts/mtp_setup.py --verify     # Verify installation")
        print(f"  python scripts/mtp_setup.py --demo       # Run demonstration")
        print(f"  python scripts/mtp_setup.py --report     # Generate status report")
        print(f"  python scripts/mtp_setup.py --vscode     # Setup VS Code config")
        return
    
    command = sys.argv[1]
    
    if command == "--install":
        setup.log("Starting MTP installation...", "info")
        
        # Check prerequisites
        if not setup.check_python_version():
            sys.exit(1)
        
        # Install Jac language
        if not setup.install_jac_language():
            setup.log("Jac installation failed", "error")
            sys.exit(1)
        
        # Install requirements
        if not setup.install_requirements():
            setup.log("Requirements installation failed", "error")
            sys.exit(1)
        
        # Create demo files
        if not setup.create_mtp_demo():
            setup.log("Demo creation failed", "error")
            sys.exit(1)
        
        # Setup VS Code
        setup.create_vscode_config()
        
        setup.log("✓ MTP installation completed successfully!", "success")
        setup.log("Next steps:", "info")
        setup.log("  1. Set OPENAI_API_KEY environment variable", "info")
        setup.log("  2. Run: python scripts/mtp_setup.py --demo", "info")
        setup.log("  3. Install VS Code Jac extension if using VS Code", "info")
        
    elif command == "--verify":
        setup.log("Verifying MTP installation...", "info")
        
        if not setup.check_python_version():
            sys.exit(1)
        
        if not setup.verify_jac_installation():
            setup.log("Jac verification failed", "error")
            sys.exit(1)
        
        setup.log("✓ MTP installation verified successfully!", "success")
        
    elif command == "--demo":
        setup.log("Running MTP demonstration...", "info")
        
        if not setup.run_demo():
            setup.log("Demo execution failed", "error")
            sys.exit(1)
        
    elif command == "--report":
        setup.log("Generating status report...", "info")
        
        report = setup.generate_report()
        print(json.dumps(report, indent=2))
        
        if report["recommendations"]:
            setup.log("Recommendations:", "warning")
            for rec in report["recommendations"]:
                setup.log(f"  • {rec}", "warning")
        
        status = "COMPLETE" if report["setup_complete"] else "INCOMPLETE"
        setup.log(f"Setup status: {status}", "success" if report["setup_complete"] else "warning")
        
    elif command == "--vscode":
        setup.log("Setting up VS Code configuration...", "info")
        
        if not setup.create_vscode_config():
            setup.log("VS Code setup failed", "error")
            sys.exit(1)
        
        setup.log("✓ VS Code configuration completed!", "success")
        
    else:
        setup.log(f"Unknown command: {command}", "error")
        sys.exit(1)

if __name__ == "__main__":
    main() 