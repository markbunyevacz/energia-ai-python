#!/usr/bin/env python3
"""
Energia AI - Task Automation & Dynamic Configuration Setup

Sets up the complete task automation and dynamic cursor configuration system.
"""

import json
import os
import sys
from pathlib import Path
import subprocess
import shutil

def setup_automation_system():
    """Set up the complete automation system"""
    project_root = Path(__file__).parent.parent
    cursor_dir = project_root / ".cursor"
    
    print("🔧 Setting up Energia AI Task Automation & Dynamic Configuration...")
    
    # 1. Ensure directory structure
    print("📁 Creating directory structure...")
    dirs_to_create = [
        cursor_dir,
        cursor_dir / "configs",
        cursor_dir / "rules",
        cursor_dir / "extensions",
        project_root / "scripts" / "automation"
    ]
    
    for dir_path in dirs_to_create:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    # 2. Make scripts executable
    print("🔐 Making scripts executable...")
    scripts_to_make_executable = [
        cursor_dir / "config-manager.py",
        cursor_dir / "startup.py",
        project_root / "scripts" / "setup-automation.py"
    ]
    
    for script in scripts_to_make_executable:
        if script.exists():
            os.chmod(script, 0o755)
    
    # 3. Create automation helper scripts
    print("⚙️ Creating automation helper scripts...")
    create_automation_helpers(project_root)
    
    # 4. Set up git hooks for automatic context switching
    print("🔗 Setting up git hooks...")
    setup_git_hooks(project_root)
    
    # 5. Create VSCode/Cursor settings integration
    print("🆚 Creating editor integration...")
    create_editor_integration(project_root)
    
    # 6. Validate Task Master AI integration
    print("📋 Validating Task Master AI integration...")
    validate_taskmaster_integration(project_root)
    
    print("\n✅ Automation system setup complete!")
    print_usage_instructions()

def create_automation_helpers(project_root: Path):
    """Create helper scripts for automation"""
    scripts_dir = project_root / "scripts" / "automation"
    
    # Task context detector
    task_detector = scripts_dir / "detect-task-context.py"
    task_detector.write_text('''#!/usr/bin/env python3
"""Detect current task context from Task Master AI"""
import json
import sys
from pathlib import Path

def get_current_task_context():
    project_root = Path(__file__).parent.parent.parent
    taskmaster_dir = project_root / ".taskmaster"
    
    if not taskmaster_dir.exists():
        return "general"
    
    tasks_file = taskmaster_dir / "tasks" / "tasks.json"
    if not tasks_file.exists():
        return "general"
    
    try:
        with open(tasks_file) as f:
            data = json.load(f)
        
        # Find in-progress tasks
        master_tasks = data.get("master", {}).get("tasks", [])
        in_progress = [t for t in master_tasks if t.get("status") == "in-progress"]
        
        if in_progress:
            task = in_progress[0]
            tags = task.get("tags", [])
            
            if "crawler" in tags:
                return "crawler-development"
            elif any(tag in tags for tag in ["ai", "ml", "embedding"]):
                return "ai-development"
            elif "backend" in tags:
                return "backend"
        
        return "backend"  # Default
    except:
        return "general"

if __name__ == "__main__":
    print(get_current_task_context())
''')
    
    # Legal compliance checker
    compliance_checker = scripts_dir / "check-legal-compliance.py"
    compliance_checker.write_text('''#!/usr/bin/env python3
"""Check Hungarian legal compliance standards"""
import re
import sys
from pathlib import Path

def check_file_compliance(file_path: Path):
    """Check a file for Hungarian legal compliance"""
    if not file_path.exists():
        return True, []
    
    issues = []
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    
    # Check for Hungarian legal citation patterns
    eli_pattern = r'eli/.*?/.*?/.*?/.*?'
    if 'njt.hu' in content and not re.search(eli_pattern, content):
        issues.append("Missing ELI standard compliance for legal references")
    
    # Check for GDPR compliance markers
    if 'personal_data' in content.lower() or 'személyes' in content:
        if 'gdpr' not in content.lower() and 'adatvédelem' not in content:
            issues.append("Potential GDPR compliance issue - personal data handling")
    
    # Check for proper Hungarian character encoding
    try:
        content.encode('utf-8')
    except UnicodeEncodeError:
        issues.append("Character encoding issue - may affect Hungarian text processing")
    
    return len(issues) == 0, issues

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])
        compliant, issues = check_file_compliance(file_path)
        
                 if compliant:
            print(f"[OK] {file_path.name} - Legal compliance OK")
        else:
            print(f"[WARNING] {file_path.name} - Compliance issues:")
            for issue in issues:
                print(f"   - {issue}")
            sys.exit(1)
    else:
        print("Usage: check-legal-compliance.py <file_path>")
''')
    
    # Make scripts executable
    for script in [task_detector, compliance_checker]:
        os.chmod(script, 0o755)

def setup_git_hooks(project_root: Path):
    """Set up git hooks for automatic configuration switching"""
    git_dir = project_root / ".git"
    if not git_dir.exists():
        print("   ⚠️ Not a git repository - skipping git hooks")
        return
    
    hooks_dir = git_dir / "hooks"
    hooks_dir.mkdir(exist_ok=True)
    
    # Pre-commit hook
    pre_commit_hook = hooks_dir / "pre-commit"
         pre_commit_hook.write_text('''#!/bin/sh
# Energia AI - Automatic context switching and compliance check
echo "Checking legal compliance and updating context..."

# Update cursor configuration based on changed files
python .cursor/config-manager.py auto

# Check legal compliance for Python files
for file in $(git diff --cached --name-only --diff-filter=ACM | grep '\\.py$'); do
    if [ -f "$file" ]; then
        python scripts/automation/check-legal-compliance.py "$file"
        if [ $? -ne 0 ]; then
            echo "Legal compliance check failed for $file"
            exit 1
        fi
    fi
done

echo "Pre-commit checks passed"
''')
    
    os.chmod(pre_commit_hook, 0o755)
    print("   ✅ Git hooks configured")

def create_editor_integration(project_root: Path):
    """Create editor integration files"""
    vscode_dir = project_root / ".vscode"
    vscode_dir.mkdir(exist_ok=True)
    
    # Tasks configuration
    tasks_config = vscode_dir / "tasks.json"
    tasks_config.write_text(json.dumps({
        "version": "2.0.0",
        "tasks": [
            {
                "label": "Switch Cursor Context",
                "type": "shell",
                "command": "python",
                "args": [".cursor/config-manager.py", "auto"],
                "group": "build",
                "presentation": {
                    "echo": True,
                    "reveal": "always",
                    "focus": False,
                    "panel": "shared"
                }
            },
            {
                "label": "Show Cursor Status",
                "type": "shell", 
                "command": "python",
                "args": [".cursor/config-manager.py", "status"],
                "group": "build"
            },
            {
                "label": "Initialize Energia AI Environment",
                "type": "shell",
                "command": "python",
                "args": [".cursor/startup.py"],
                "group": "build"
            }
        ]
    }, indent=2))
    
    # Settings
    settings_config = vscode_dir / "settings.json"
    if not settings_config.exists():
        settings_config.write_text(json.dumps({
            "python.defaultInterpreterPath": "./venv/bin/python",
            "python.linting.enabled": True,
            "python.linting.ruffEnabled": True,
            "python.formatting.provider": "ruff",
            "cursor.ai.contextFiles": [
                "docs/Python_Architektura_Specifikacio_Backlog.md",
                ".cursor/automation-config.json"
            ]
        }, indent=2))

def validate_taskmaster_integration(project_root: Path):
    """Validate Task Master AI integration"""
    taskmaster_dir = project_root / ".taskmaster"
    mcp_file = project_root / ".cursor" / "mcp.json"
    
    if not taskmaster_dir.exists():
        print("   ⚠️ Task Master AI not initialized")
        print("   Run: npx task-master-ai init")
        return
    
    if not mcp_file.exists():
        print("   ⚠️ MCP configuration missing")
        return
    
    try:
        with open(mcp_file) as f:
            mcp_config = json.load(f)
        
        if "task-master-ai" in mcp_config.get("mcpServers", {}):
            print("   ✅ Task Master AI integration verified")
        else:
            print("   ⚠️ Task Master AI not configured in MCP")
    except:
        print("   ⚠️ Error reading MCP configuration")

def print_usage_instructions():
    """Print usage instructions"""
    print("""
🎯 Energia AI Task Automation & Dynamic Configuration

USAGE:
  # Automatic context switching
  python .cursor/config-manager.py auto
  
  # Manual context switching  
  python .cursor/config-manager.py switch --context backend
  python .cursor/config-manager.py switch --context ai-development
  python .cursor/config-manager.py switch --context crawler-development
  
  # Check current status
  python .cursor/config-manager.py status
  
  # Initialize environment (run when opening project)
  python .cursor/startup.py

FEATURES:
  ✅ Dynamic cursor configuration based on:
     • Recently modified files
     • Current directory context
     • Git branch names
     • Task Master AI active tasks
  
  ✅ Legal AI specific automation:
     • Hungarian legal compliance checking
     • ELI standard validation
     • GDPR compliance hints
     • Legal source crawling guidelines
  
  ✅ Task Master AI integration:
     • Context-aware task suggestions
     • Automatic task prioritization
     • Development phase tracking
  
  ✅ Git hooks for automatic switching
  
  ✅ Editor integration (VSCode/Cursor tasks)

CONTEXTS AVAILABLE:
  • backend: FastAPI, database, core services
  • ai-development: ML/AI, embeddings, RAG, Hungarian NLP
  • crawler-development: Legal data crawling, anti-detection

The system will automatically adapt to your current work context! 🚀
""")

if __name__ == "__main__":
    setup_automation_system() 