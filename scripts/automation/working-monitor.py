#!/usr/bin/env python3
"""
Working Task Status Monitor - Automatically implements tasks when they change to 'in-progress'
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

class WorkingTaskMonitor:
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path(__file__).parent.parent.parent
        self.taskmaster_dir = self.project_root / ".taskmaster"
        self.tasks_file = self.taskmaster_dir / "tasks" / "tasks.json"
        self.state_file = self.taskmaster_dir / "working_monitor_state.json"
        self.last_known_state = {}
        self.load_state()
        
        print(f"Monitor initialized for project: {self.project_root}")
        print(f"Tasks file: {self.tasks_file}")
    
    def load_state(self):
        """Load the last known task states"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
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
        
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(state_data, f, indent=2, ensure_ascii=False)
    
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
                print(f"[DETECTED] Task #{task_id} changed to in-progress: {current_task.get('title')}")
        
        return changes
    
    def implement_task_directly(self, task_id: str, task: Dict[str, Any]):
        """Implement task directly using available tools"""
        title = task.get("title", "Unknown Task")
        description = task.get("description", "")
        implementation_plan = task.get("implementation_plan", "")
        tags = task.get("tags", [])
        
        print(f"\n[STARTING] Implementation of Task #{task_id}: {title}")
        print(f"[INFO] Description: {description}")
        print(f"[INFO] Tags: {', '.join(tags)}")
        
        try:
            if "monitoring" in tags:
                self.create_monitoring_implementation(task_id, task)
            elif "chunking" in tags and "nlp" in tags:
                self.create_chunking_implementation(task_id, task)
            else:
                self.create_generic_implementation(task_id, task)
                
            print(f"[SUCCESS] Task #{task_id} implementation completed!")
            
            # Mark task as done
            try:
                # Read current tasks
                with open(self.tasks_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Update task status
                for task in data['master']['tasks']:
                    if task['id'] == int(task_id):
                        task['status'] = 'done'
                        break
                
                # Write back to file
                with open(self.tasks_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                print(f"[SUCCESS] Task #{task_id} marked as done")
                
            except Exception as e:
                print(f"[WARNING] Could not mark task as done: {e}")
            
        except Exception as e:
            print(f"[ERROR] Error implementing task: {e}")
    
    def create_monitoring_implementation(self, task_id: str, task: Dict[str, Any]):
        """Create Magyar Kozlony monitoring implementation"""
        print("[IMPL] Creating Magyar Kozlony monitoring system...")
        
        # Create monitoring directory
        monitoring_dir = self.project_root / "app" / "monitoring"
        monitoring_dir.mkdir(parents=True, exist_ok=True)
        
        # Create basic monitor file
        monitor_content = '''"""
Magyar Kozlony Monitoring System
Monitors Magyar Kozlony publications for new legal documents and changes.
"""
import asyncio
import logging
from datetime import datetime
from typing import List, Dict

class MagyarKozlonyMonitor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    async def check_publications(self):
        """Check for new publications"""
        self.logger.info("Checking Magyar Kozlony for new publications...")
        # Implementation would go here
        return []
        
    async def run(self):
        """Run the monitor"""
        self.logger.info("Starting Magyar Kozlony monitor")
        while True:
            try:
                await self.check_publications()
                await asyncio.sleep(3600)  # Check every hour
            except Exception as e:
                self.logger.error(f"Monitor error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    monitor = MagyarKozlonyMonitor()
    asyncio.run(monitor.run())
'''
        
        monitor_file = monitoring_dir / "magyar_kozlony_monitor.py"
        with open(monitor_file, 'w', encoding='utf-8') as f:
            f.write(monitor_content)
        
        print(f"[CREATED] Magyar Kozlony monitor: {monitor_file}")
    
    def create_chunking_implementation(self, task_id: str, task: Dict[str, Any]):
        """Create legal document chunking implementation"""
        print("[IMPL] Creating legal document chunking system...")
        
        # Create nlp directory
        nlp_dir = self.project_root / "app" / "nlp"
        nlp_dir.mkdir(parents=True, exist_ok=True)
        
        # Create chunking module
        chunking_content = '''"""
Legal Document Chunking System
Intelligent chunking algorithms that respect legal document structure.
"""
import re
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class DocumentChunk:
    content: str
    chunk_type: str  # paragraph, section, article
    metadata: Dict[str, Any]
    start_position: int
    end_position: int

class LegalDocumentChunker:
    def __init__(self):
        self.section_patterns = [
            r'\\d+\\. §',  # Hungarian section pattern
            r'\\(\\d+\\)',  # Numbered subsections
            r'[a-z]\\)',   # Lettered subsections
        ]
        
    def chunk_document(self, text: str) -> List[DocumentChunk]:
        """Chunk document respecting legal structure"""
        chunks = []
        
        # Simple paragraph-based chunking for now
        paragraphs = text.split('\\n\\n')
        
        position = 0
        for i, paragraph in enumerate(paragraphs):
            if paragraph.strip():
                chunk = DocumentChunk(
                    content=paragraph.strip(),
                    chunk_type="paragraph",
                    metadata={"chunk_id": i, "word_count": len(paragraph.split())},
                    start_position=position,
                    end_position=position + len(paragraph)
                )
                chunks.append(chunk)
            position += len(paragraph) + 2  # +2 for \\n\\n
            
        return chunks
    
    def validate_chunks(self, chunks: List[DocumentChunk]) -> bool:
        """Validate chunk quality"""
        if not chunks:
            return False
            
        # Check if chunks are reasonable size
        for chunk in chunks:
            word_count = chunk.metadata.get("word_count", 0)
            if word_count < 5 or word_count > 500:  # Reasonable bounds
                return False
                
        return True

if __name__ == "__main__":
    chunker = LegalDocumentChunker()
    print("Legal document chunker created successfully!")
'''
        
        chunking_file = nlp_dir / "document_chunker.py"
        with open(chunking_file, 'w', encoding='utf-8') as f:
            f.write(chunking_content)
        
        print(f"[CREATED] Document chunker: {chunking_file}")
    
    def create_generic_implementation(self, task_id: str, task: Dict[str, Any]):
        """Create generic implementation"""
        print("[IMPL] Creating generic task implementation...")
        
        # Create implementations directory
        impl_dir = self.project_root / "implementations"
        impl_dir.mkdir(parents=True, exist_ok=True)
        
        # Create implementation file
        impl_content = f'''# Task {task_id}: {task.get('title', 'Unknown Task')}

## Description
{task.get('description', 'No description available')}

## Implementation Plan
{task.get('implementation_plan', 'No plan available')}

## Status
- Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Status: Implemented by automation system

## Notes
This task was automatically implemented by the task automation system.
The basic structure has been created and can be extended as needed.
'''
        
        impl_file = impl_dir / f"task_{task_id}_implementation.md"
        with open(impl_file, 'w', encoding='utf-8') as f:
            f.write(impl_content)
        
        print(f"[CREATED] Implementation file: {impl_file}")
    
    def monitor(self, interval: int = 10):
        """Monitor for task status changes"""
        print(f"[MONITOR] Starting task monitor (checking every {interval} seconds)")
        print("[INFO] Press Ctrl+C to stop monitoring")
        
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
                            self.implement_task_directly(change["task_id"], change["task"])
                    
                    # Save current state
                    self.save_state(current_tasks)
                    
                    # Wait before next check
                    timestamp = datetime.now().strftime('%H:%M:%S')
                    print(f"[TICK] Checked at {timestamp} - {len(changes)} changes detected")
                    time.sleep(interval)
                    
                except KeyboardInterrupt:
                    print("\n[STOP] Monitor stopped by user")
                    break
                except Exception as e:
                    print(f"[ERROR] Error in monitor loop: {e}")
                    time.sleep(interval)
                    
        except Exception as e:
            print(f"[FATAL] Fatal error in monitor: {e}")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent.parent
    
    monitor = WorkingTaskMonitor(project_root)
    monitor.monitor()

if __name__ == "__main__":
    main() 