#!/usr/bin/env python3
"""
Simple Task Status Monitor - Automatically implements tasks when they change to 'in-progress'
Uses MCP Task Master AI tools for implementation
"""
import json
import time
import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

class SimpleTaskMonitor:
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path(__file__).parent.parent.parent
        self.taskmaster_dir = self.project_root / ".taskmaster"
        self.tasks_file = self.taskmaster_dir / "tasks" / "tasks.json"
        self.state_file = self.taskmaster_dir / "monitor_state.json"
        self.last_known_state = {}
        self.load_state()
        
        print(f"Monitor initialized for project: {self.project_root}")
        print(f"Tasks file: {self.tasks_file}")
    
    def load_state(self):
        """Load the last known task states"""
        if self.state_file.exists():
            try:
                with open(self.state_file) as f:
                    data = json.load(f)
                    self.last_known_state = data.get("task_states", {})
            except Exception as e:
                print(f"Error loading state: {e}")
                self.last_known_state = {}
        else:
            self.last_known_state = {}
    
    def save_state(self, current_state: Dict[str, Dict]):
        """Save current task states"""
        self.last_known_state = current_state
        state_data = {
            "task_states": current_state,
            "last_update": datetime.now().isoformat()
        }
        
        with open(self.state_file, 'w') as f:
            json.dump(state_data, f, indent=2)
    
    def get_current_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Get current tasks and their states"""
        if not self.tasks_file.exists():
            print(f"Tasks file not found: {self.tasks_file}")
            return {}
        
        try:
            with open(self.tasks_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            tasks = {}
            
            # Check the structure - might be flat tasks or nested in master
            if "master" in data and "tasks" in data["master"]:
                task_list = data["master"]["tasks"]
            elif isinstance(data, list):
                task_list = data
            elif "tasks" in data:
                task_list = data["tasks"]
            else:
                print(f"Unknown task file structure: {list(data.keys())}")
                return {}
            
            for task in task_list:
                task_id = task.get("id")
                if task_id:
                    tasks[str(task_id)] = {
                        "status": task.get("status"),
                        "title": task.get("title"),
                        "tags": task.get("tags", []),
                        "implementation_plan": task.get("implementation_plan"),
                        "description": task.get("description")
                    }
            
            print(f"Loaded {len(tasks)} tasks")
            return tasks
            
        except Exception as e:
            print(f"Error reading tasks: {e}")
            return {}
    
    def detect_status_changes(self) -> list:
        """Detect tasks that changed to 'in-progress' status"""
        current_tasks = self.get_current_tasks()
        changes = []
        
        for task_id, current_task in current_tasks.items():
            previous_task = self.last_known_state.get(task_id, {})
            previous_status = previous_task.get("status", "unknown")
            current_status = current_task.get("status")
            
            # Check if status changed to in-progress
            if previous_status != "in-progress" and current_status == "in-progress":
                changes.append({
                    "task_id": task_id,
                    "task": current_task,
                    "change_type": "started",
                    "previous_status": previous_status
                })
                print(f"[OK] Detected Task #{task_id} changed to in-progress: {current_task.get('title')}")
        
        return changes
    
    def implement_task_with_mcp(self, task_id: str, task: Dict[str, Any]):
        """Implement task using MCP Task Master AI tools"""
        title = task.get("title", "Unknown Task")
        description = task.get("description", "")
        implementation_plan = task.get("implementation_plan", "")
        tags = task.get("tags", [])
        
        print(f"\n🚀 Starting automatic implementation of Task #{task_id}: {title}")
        print(f"📋 Description: {description}")
        print(f"🏷️  Tags: {', '.join(tags)}")
        
        # Prepare implementation prompt based on task details
        implementation_prompt = f"""
        Task #{task_id}: {title}
        
        Description: {description}
        
        Implementation Plan:
        {implementation_plan}
        
        Tags: {', '.join(tags)}
        
        Please implement this task step by step according to the plan. Create all necessary files, 
        configurations, and code. Ensure the implementation is complete and working.
        """
        
        try:
            # Use task update to start implementation
            project_root_encoded = str(self.project_root).replace('\\', '\\\\')
            
            # First update the task with implementation start notice
            update_cmd = [
                "python", "-c", 
                f"""
import sys
sys.path.append(r'{self.project_root}')
from scripts.mcp_tools import update_task
result = update_task('{task_id}', 'Starting automatic implementation...', r'{project_root_encoded}')
print('Update result:', result)
"""
            ]
            
            print("📝 Updating task status...")
            result = subprocess.run(update_cmd, capture_output=True, text=True, cwd=self.project_root)
            if result.returncode != 0:
                print(f"❌ Update failed: {result.stderr}")
            
            # Now start the actual implementation using a specialized script
            implement_cmd = [
                "python", 
                str(self.project_root / "scripts" / "automation" / "task-implementer.py"),
                task_id,
                str(self.project_root)
            ]
            
            print("🔨 Starting implementation process...")
            process = subprocess.Popen(
                implement_cmd,
                cwd=self.project_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Don't wait for completion - let it run in background
            print(f"✅ Implementation process started for Task #{task_id} (PID: {process.pid})")
            
        except Exception as e:
            print(f"❌ Error starting implementation: {e}")
    
    def monitor(self, interval: int = 10):
        """Monitor for task status changes"""
        print(f"🔍 Starting task monitor (checking every {interval} seconds)")
        print("Press Ctrl+C to stop monitoring")
        
        try:
            while True:
                try:
                    # Get current state
                    current_tasks = self.get_current_tasks()
                    
                    # Detect changes
                    changes = self.detect_status_changes()
                    
                    # Process changes
                    for change in changes:
                        if change["change_type"] == "started":
                            self.implement_task_with_mcp(change["task_id"], change["task"])
                    
                    # Save current state
                    self.save_state(current_tasks)
                    
                    # Wait before next check
                    print(f"⏰ Checked at {datetime.now().strftime('%H:%M:%S')} - {len(changes)} changes detected")
                    time.sleep(interval)
                    
                except KeyboardInterrupt:
                    print("\n👋 Monitor stopped by user")
                    break
                except Exception as e:
                    print(f"❌ Error in monitor loop: {e}")
                    time.sleep(interval)
                    
        except Exception as e:
            print(f"❌ Fatal error in monitor: {e}")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent.parent
    
    monitor = SimpleTaskMonitor(project_root)
    monitor.monitor()

if __name__ == "__main__":
    main() 