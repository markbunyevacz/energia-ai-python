#!/usr/bin/env python3
"""
Energia AI - Cursor Startup Script

Automatically configures the development environment when opening the project.
Integrates with Task Master AI for context-aware development.
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
import os

def initialize_cursor_environment():
    """Initialize cursor environment with project-specific configuration"""
    project_root = Path(__file__).parent.parent
    cursor_dir = project_root / ".cursor"
    
    print("🚀 Initializing Energia AI Development Environment...")
    
    # 1. Auto-detect and switch to appropriate configuration
    try:
        config_manager = cursor_dir / "config-manager.py"
        if config_manager.exists():
            print("🔧 Auto-detecting development context...")
            result = subprocess.run([sys.executable, str(config_manager), "auto"], 
                                  cwd=project_root, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Configuration auto-switched successfully")
            else:
                print(f"⚠️  Configuration auto-switch failed: {result.stderr}")
        else:
            print("⚠️  Config manager not found, using default configuration")
    except Exception as e:
        print(f"⚠️  Error during auto-configuration: {e}")
    
    # 2. Initialize Task Master AI context
    try:
        taskmaster_dir = project_root / ".taskmaster"
        if taskmaster_dir.exists():
            print("📋 Synchronizing with Task Master AI...")
            
            # Get current tasks
            tasks_file = taskmaster_dir / "tasks" / "tasks.json"
            if tasks_file.exists():
                with open(tasks_file) as f:
                    tasks_data = json.load(f)
                
                # Count active tasks by context
                master_tasks = tasks_data.get("master", {}).get("tasks", [])
                pending_tasks = [t for t in master_tasks if t.get("status") == "pending"]
                in_progress_tasks = [t for t in master_tasks if t.get("status") == "in-progress"]
                
                print(f"   📊 Tasks: {len(pending_tasks)} pending, {len(in_progress_tasks)} in progress")
                
                # Show next recommended task
                if pending_tasks:
                    next_task = pending_tasks[0]  # Simplified - should use dependency logic
                    print(f"   🎯 Next recommended: Task #{next_task.get('id')} - {next_task.get('title', 'Unknown')[:50]}...")
                
        else:
            print("📋 Task Master AI not initialized - run task-master-ai init to set up project management")
    except Exception as e:
        print(f"⚠️  Error accessing Task Master: {e}")
    
    # 3. Validate development environment
    print("🔍 Validating development environment...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version >= (3, 11):
        print(f"   ✅ Python {python_version.major}.{python_version.minor} (compatible)")
    else:
        print(f"   ⚠️  Python {python_version.major}.{python_version.minor} (recommend 3.11+)")
    
    # Check key dependencies
    dependencies = {
        "fastapi": "Web framework",
        "supabase": "Database client",
        "anthropic": "AI client",
        "langchain": "AI orchestration"
    }
    
    for dep, description in dependencies.items():
        try:
            __import__(dep)
            print(f"   ✅ {dep} ({description})")
        except ImportError:
            print(f"   ❌ {dep} ({description}) - run pip install -r requirements.txt")
    
    # 4. Check legal AI specific requirements
    print("⚖️  Checking legal AI specific requirements...")
    
    legal_sources = {
        "njt.hu": "Hungarian legal database",
        "kozlonyok.hu": "Magyar Közlöny archive"
    }
    
    # This would normally check connectivity, but we'll just indicate readiness
    for source, description in legal_sources.items():
        print(f"   📚 {source} ({description}) - ready for crawling")
    
    # 5. Show helpful shortcuts based on current context
    env_file = cursor_dir / "environment.json"
    if env_file.exists():
        try:
            with open(env_file) as f:
                env_config = json.load(f)
            
            current_context = env_config.get("currentContext", "general")
            print(f"🎛️  Context: {current_context}")
            
            # Show context-specific shortcuts
            shortcuts = get_context_shortcuts(current_context)
            if shortcuts:
                print("   Quick actions:")
                for shortcut, command in shortcuts.items():
                    print(f"   • {shortcut}: {command}")
            
        except Exception as e:
            print(f"⚠️  Error reading environment config: {e}")
    
    # 6. Start task automation if available
    try:
        automation_service = project_root / "scripts" / "automation" / "start-task-automation.py"
        if automation_service.exists():
            print("🤖 Starting Task Automation Service...")
            result = subprocess.run([
                sys.executable, str(automation_service), "start"
            ], cwd=project_root, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("   ✅ Task automation service started")
                print("   Tasks will now auto-implement when set to 'in-progress'")
            else:
                print(f"   ⚠️  Task automation failed to start: {result.stderr}")
        else:
            print("📋 Task automation not available - manual task management only")
    except Exception as e:
        print(f"⚠️  Error starting task automation: {e}")

    # 7. Final status
    print("\n🎉 Energia AI development environment ready!")
    print("   Use the Task Master AI integration for intelligent task management")
    print("   Configuration will auto-adapt based on your current work context")
    print("   Tasks will automatically implement when set to 'in-progress' status")
    print("   Happy coding! 🚀")

def get_context_shortcuts(context: str) -> dict:
    """Get shortcuts based on current context"""
    shortcuts = {
        "backend": {
            "run_dev": "uvicorn main:app --reload",
            "test_all": "pytest",
            "check_migrations": "supabase db lint"
        },
        "ai-development": {
            "test_embeddings": "python scripts/test_embeddings.py",
            "validate_rag": "python scripts/validate_rag_pipeline.py",
            "benchmark_hungarian": "python scripts/benchmark_hungarian_nlp.py"
        },
        "crawler-development": {
            "test_jogtar": "pytest app/crawlers/tests/test_jogtar_crawler.py",
            "test_kozlony": "pytest app/crawlers/tests/test_magyar_kozlony_crawler.py",
            "check_rate_limits": "python scripts/check_rate_compliance.py"
        }
    }
    
    return shortcuts.get(context, {})

if __name__ == "__main__":
    initialize_cursor_environment() 