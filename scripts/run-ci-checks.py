#!/usr/bin/env python3
"""
Local CI/CD checks script for Energia AI
Run all CI/CD pipeline checks locally before pushing
"""
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Tuple

def run_command(cmd: List[str], description: str, cwd: Path = None) -> bool:
    """Run a command and return success status"""
    print(f"🔍 {description}...")
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd, 
            check=True, 
            cwd=cwd,
            capture_output=True,
            text=True
        )
        duration = time.time() - start_time
        print(f"✅ {description} passed ({duration:.1f}s)")
        return True
    except subprocess.CalledProcessError as e:
        duration = time.time() - start_time
        print(f"❌ {description} failed ({duration:.1f}s)")
        print(f"Error: {e.stderr}")
        if e.stdout:
            print(f"Output: {e.stdout}")
        return False

def main():
    """Run all CI/CD checks locally"""
    project_root = Path(__file__).parent.parent
    
    print("🚀 Running local CI/CD checks for Energia AI")
    print("=" * 50)
    
    checks = [
        # Code formatting and linting
        (["ruff", "format", "--check", "--diff", "."], "Code formatting check"),
        (["ruff", "check", ".", "--output-format=text"], "Code linting"),
        
        # Type checking
        (["mypy", "src/", "--ignore-missing-imports"], "Type checking"),
        
        # Security checks
        (["bandit", "-r", "src/", "-f", "txt"], "Security scan (Bandit)"),
        (["safety", "check", "--file", "requirements-minimal.txt"], "Dependency security (Safety)"),
        
        # Unit tests
        (["python", "-m", "pytest", "tests/test_main.py", "-v"], "Unit tests"),
        
        # Import check
        (["python", "-c", "import src.energia_ai.main; print('✅ Import successful')"], "Import check"),
    ]
    
    failed_checks = []
    total_start = time.time()
    
    for cmd, description in checks:
        if not run_command(cmd, description, project_root):
            failed_checks.append(description)
        print()  # Empty line for readability
    
    total_duration = time.time() - total_start
    
    print("=" * 50)
    print(f"📊 CI/CD Check Results ({total_duration:.1f}s total)")
    
    if failed_checks:
        print(f"❌ {len(failed_checks)} checks failed:")
        for check in failed_checks:
            print(f"   - {check}")
        print("\n💡 Fix the failed checks before pushing to avoid CI failures")
        sys.exit(1)
    else:
        print("✅ All checks passed! Ready to push 🎉")
        print("\n📋 Optional checks you can also run:")
        print("   - Integration tests: pytest tests/ -m integration -v")
        print("   - Performance tests: pytest tests/ -m performance -v")
        print("   - Full test suite: pytest tests/ -v --cov=src")
        sys.exit(0)

if __name__ == "__main__":
    main() 