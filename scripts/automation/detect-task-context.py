#!/usr/bin/env python3
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
