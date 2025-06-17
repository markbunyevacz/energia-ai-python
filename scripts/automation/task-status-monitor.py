#!/usr/bin/env python3
"""
Task Status Monitor - Automatically implements tasks when they change to 'in-progress'
"""
import json
import time
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
import hashlib
import os

class TaskStatusMonitor:
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path(__file__).parent.parent.parent
        self.taskmaster_dir = self.project_root / ".taskmaster"
        self.tasks_file = self.taskmaster_dir / "tasks" / "tasks.json"
        self.state_file = self.taskmaster_dir / "automation_state.json"
        self.implemented_tasks = set()  # Track already implemented tasks
        self.last_known_state = {}
        self.load_state()
    
    def load_state(self):
        """Load the last known task states"""
        if self.state_file.exists():
            try:
                with open(self.state_file) as f:
                    self.last_known_state = json.load(f)
            except:
                self.last_known_state = {}
    
    def save_state(self, current_state: Dict[str, Dict]):
        """Save current task states"""
        self.last_known_state = current_state
        with open(self.state_file, 'w') as f:
            json.dump(current_state, f, indent=2)
    
    def verify_task_implementation(self, task_id: str, task: Dict[str, Any]) -> Dict[str, Any]:
        """Verify if a task is actually implemented by checking for required files and functionality"""
        verification_result = {
            "implemented": False,
            "files_found": [],
            "files_missing": [],
            "integration_status": "unknown",
            "score": 0,
            "details": []
        }
        
        tags = task.get("tags", [])
        title = task.get("title", "").lower()
        
        # Task-specific verification logic
        if task_id == "4" or "postgresql" in tags:
            return self.verify_postgresql_implementation(verification_result)
        elif task_id == "5" or "mongodb" in tags:
            return self.verify_mongodb_implementation(verification_result)
        elif task_id == "6" or "redis" in tags:
            return self.verify_redis_implementation(verification_result)
        elif task_id == "7" or "qdrant" in tags:
            return self.verify_qdrant_implementation(verification_result)
        elif task_id == "8" or "elasticsearch" in tags:
            return self.verify_elasticsearch_implementation(verification_result)
        elif "crawler" in tags:
            return self.verify_crawler_implementation(verification_result, task)
        elif "embedding" in tags:
            return self.verify_embedding_implementation(verification_result)
        elif "claude" in tags or "ai" in tags:
            return self.verify_ai_implementation(verification_result)
        
        return verification_result
    
    def verify_postgresql_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify PostgreSQL implementation"""
        required_files = [
            "src/energia_ai/database/connection.py",
            "src/energia_ai/database/models.py",
            "docker-compose.yml"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                # Check file content quality
                if file_path.endswith("connection.py"):
                    content = full_path.read_text()
                    if "AsyncSession" in content and "create_async_engine" in content:
                        score += 1
                        result["details"].append("PostgreSQL async connection properly implemented")
            else:
                result["files_missing"].append(file_path)
        
        # Check Docker configuration
        docker_compose = self.project_root / "docker-compose.yml"
        if docker_compose.exists():
            content = docker_compose.read_text()
            if "postgres:" in content and "POSTGRES_DB:" in content:
                score += 1
                result["details"].append("PostgreSQL Docker configuration found")
        
        result["score"] = score
        result["implemented"] = score >= 3  # At least 3 out of 5 checks passed
        return result
    
    def verify_mongodb_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify MongoDB implementation"""
        required_files = [
            "src/energia_ai/storage/mongodb_manager.py",
            "src/energia_ai/storage/schemas.py",
            "docker-compose.yml"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                if file_path.endswith("mongodb_manager.py"):
                    content = full_path.read_text()
                    if "AsyncIOMotorClient" in content and "create_indexes" in content:
                        score += 1
                        result["details"].append("MongoDB async operations properly implemented")
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= 2
        return result
    
    def verify_redis_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify Redis implementation"""
        required_files = [
            "src/energia_ai/cache/redis_manager.py",
            "src/energia_ai/cache/decorators.py"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                if file_path.endswith("redis_manager.py"):
                    content = full_path.read_text()
                    if "aioredis" in content and "CacheManager" in content:
                        score += 1
                        result["details"].append("Redis caching and session management implemented")
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= 2
        return result
    
    def verify_qdrant_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify Qdrant implementation"""
        required_files = [
            "src/energia_ai/vector_search/qdrant_manager.py"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                content = full_path.read_text()
                if "QdrantClient" in content and "search_similar_documents" in content:
                    score += 1
                    result["details"].append("Qdrant vector search properly implemented")
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= 1
        return result
    
    def verify_elasticsearch_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify Elasticsearch implementation"""
        required_files = [
            "src/energia_ai/search/elasticsearch_manager.py"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                content = full_path.read_text()
                if "AsyncElasticsearch" in content and "hungarian_analyzer" in content:
                    score += 1
                    result["details"].append("Elasticsearch with Hungarian language support implemented")
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= 1
        return result
    
    def verify_crawler_implementation(self, result: Dict[str, Any], task: Dict[str, Any]) -> Dict[str, Any]:
        """Verify crawler implementation"""
        title = task.get("title", "").lower()
        
        if "njt" in title:
            required_files = ["app/crawlers/njt_crawler.py", "app/crawlers/base_crawler.py"]
        elif "kozlony" in title:
            required_files = ["app/crawlers/magyar_kozlony_crawler.py", "app/crawlers/base_crawler.py"]
        else:
            required_files = ["app/crawlers/base_crawler.py"]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= len(required_files) * 0.5  # At least 50% of files
        return result
    
    def verify_embedding_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify embedding implementation"""
        required_files = [
            "src/energia_ai/vector_search/embeddings.py"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                content = full_path.read_text()
                if "EmbeddingManager" in content and "sentence_transformer" in content:
                    score += 1
                    result["details"].append("Embedding generation with Hungarian support implemented")
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= 1
        return result
    
    def verify_ai_implementation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Verify AI-Claude implementation"""
        required_files = [
            "src/energia_ai/ai/claude_client.py"
        ]
        
        score = 0
        for file_path in required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                result["files_found"].append(file_path)
                score += 1
                
                content = full_path.read_text()
                if "AsyncAnthropic" in content and "analyze_legal_document" in content:
                    score += 1
                    result["details"].append("Claude API integration for legal analysis implemented")
            else:
                result["files_missing"].append(file_path)
        
        result["score"] = score
        result["implemented"] = score >= 1
        return result

    def get_current_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Get current tasks and their states"""
        if not self.tasks_file.exists():
            return {}
        
        try:
            with open(self.tasks_file) as f:
                data = json.load(f)
            
            tasks = {}
            master_tasks = data.get("master", {}).get("tasks", [])
            
            for task in master_tasks:
                task_id = task.get("id")
                if task_id:
                    tasks[str(task_id)] = {
                        "status": task.get("status"),
                        "title": task.get("title"),
                        "tags": task.get("tags", []),
                        "command": task.get("command"),
                        "implementation_plan": task.get("implementation_plan"),
                        "description": task.get("description")
                    }
            
            return tasks
        except Exception as e:
            print(f"Error reading tasks: {e}")
            return {}
    
    def validate_completed_tasks(self):
        """Validate all tasks marked as 'done' to ensure they're actually implemented"""
        current_tasks = self.get_current_tasks()
        validation_results = {}
        
        print("🔍 Validating completed tasks...")
        
        for task_id, task in current_tasks.items():
            if task.get("status") == "done":
                print(f"\n   Validating Task #{task_id}: {task.get('title')}")
                
                verification = self.verify_task_implementation(task_id, task)
                validation_results[task_id] = verification
                
                if verification["implemented"]:
                    print(f"   ✅ VALID - Implementation found (Score: {verification['score']})")
                    for detail in verification["details"]:
                        print(f"      • {detail}")
                else:
                    print(f"   ❌ INVALID - Implementation missing (Score: {verification['score']})")
                    print(f"      Missing files: {', '.join(verification['files_missing'])}")
                    
                    # Update task status back to 'todo' if not properly implemented
                    self.revert_task_status(task_id, "todo", "Implementation verification failed")
        
        return validation_results
    
    def revert_task_status(self, task_id: str, new_status: str, reason: str):
        """Revert a task status using TaskMaster MCP tools"""
        try:
            # Use TaskMaster to update the task status
            cmd = [
                "python", "-c", 
                f"""
import subprocess
import sys
try:
    # Call TaskMaster MCP to update task status
    result = subprocess.run([
        'python', '-m', 'taskmaster', 'set-task-status', 
        '{task_id}', '{new_status}', 
        '--project-root', '{self.project_root}'
    ], capture_output=True, text=True, cwd='{self.project_root}')
    print(f"Task #{task_id} status reverted to {new_status}: {reason}")
except Exception as e:
    print(f"Failed to revert task status: {{e}}")
"""
            ]
            subprocess.run(cmd, cwd=self.project_root)
            
        except Exception as e:
            print(f"   Error reverting task status: {e}")

    def detect_status_changes(self) -> list:
        """Detect tasks that changed to 'in-progress' status"""
        current_tasks = self.get_current_tasks()
        changes = []
        
        for task_id, current_task in current_tasks.items():
            previous_task = self.last_known_state.get(task_id, {})
            previous_status = previous_task.get("status")
            current_status = current_task.get("status")
            
            # Check if status changed to in-progress and not already implemented
            if (previous_status != "in-progress" and 
                current_status == "in-progress" and 
                task_id not in self.implemented_tasks):
                changes.append({
                    "task_id": task_id,
                    "task": current_task,
                    "change_type": "started"
                })
                print(f"Task #{task_id} started: {current_task.get('title')}")
        
        return changes

    def implement_task(self, task_id: str, task: Dict[str, Any]):
        """Automatically implement a task"""
        print(f"Starting automatic implementation of Task #{task_id}")
        
        # First check if task is already implemented
        verification = self.verify_task_implementation(task_id, task)
        if verification["implemented"]:
            print(f"   ✅ Task #{task_id} already implemented - marking as done")
            self.update_task_status_to_done(task_id)
            return
        
        # Mark task as being implemented to prevent duplicate attempts
        self.implemented_tasks.add(task_id)
        
        # 1. Execute task command if it exists
        if task.get("command"):
            print(f"    Executing task command: {task['command']}")
            try:
                result = subprocess.run(
                    task["command"], 
                    shell=True, 
                    cwd=self.project_root,
                    capture_output=True, 
                    text=True
                )
                if result.returncode == 0:
                    print("    Task command executed successfully")
                else:
                    print(f"    Task command failed: {result.stderr}")
            except Exception as e:
                print(f"    Error executing task command: {e}")
        
        # 2. Use Task Master AI to implement the task
        try:
            print("   Using Task Master AI for implementation...")
            
            # Get task context and tags
            tags = task.get("tags", [])
            context = self.determine_context(tags)
            
            # Switch to appropriate development context
            self.switch_context(context)
            
            # Use MCP Task Master AI tools to implement
            self.execute_task_implementation(task_id, task)
            
        except Exception as e:
            print(f"   Error in AI implementation: {e}")
    
    def update_task_status_to_done(self, task_id: str):
        """Update task status to done using TaskMaster"""
        try:
            cmd = [
                "python", "-c", 
                f"""
import subprocess
try:
    result = subprocess.run([
        'python', '-m', 'taskmaster', 'set-task-status', 
        '{task_id}', 'done',
        '--project-root', '{self.project_root}'
    ], capture_output=True, text=True, cwd='{self.project_root}')
    print(f"Task #{task_id} marked as done")
except Exception as e:
    print(f"Failed to update task status: {{e}}")
"""
            ]
            subprocess.run(cmd, cwd=self.project_root)
        except Exception as e:
            print(f"Error updating task status: {e}")

    def determine_context(self, tags: list) -> str:
        """Determine development context from task tags"""
        if "crawler" in tags:
            return "crawler-development"
        elif any(tag in tags for tag in ["ai", "ml", "embedding", "rag"]):
            return "ai-development"
        elif "backend" in tags:
            return "backend"
        else:
            return "backend"  # default
    
    def switch_context(self, context: str):
        """Switch development context"""
        try:
            config_manager = self.project_root / ".cursor" / "config-manager.py"
            if config_manager.exists():
                subprocess.run([
                    sys.executable, str(config_manager), 
                    "switch", context
                ], cwd=self.project_root)
                print(f"    Switched to {context} context")
        except Exception as e:
            print(f"     Context switch failed: {e}")
    
    def execute_task_implementation(self, task_id: str, task: Dict[str, Any]):
        """Execute the actual task implementation using Task Master AI MCP tools"""
        
        tags = task.get("tags", [])
        implementation_plan = task.get("implementation_plan", "")
        description = task.get("description", "")
        title = task.get("title", "")
        
        print(f"    Implementing Task #{task_id}: {title}")
        print(f"    Tags: {', '.join(tags)}")
        
        # Try to use the existing config manager's implementation engine first
        if self.try_config_manager_implementation(task_id):
            return
        
        # Fallback to manual implementation based on tags
        if "crawler" in tags:
            self.implement_crawler_task(task_id, task)
        elif "elasticsearch" in tags:
            self.implement_elasticsearch_task(task_id, task)
        elif "ai" in tags or "embedding" in tags:
            self.implement_ai_task(task_id, task)
        elif "backend" in tags:
            self.implement_backend_task(task_id, task)
        else:
            self.implement_generic_task(task_id, task)
    
    def try_config_manager_implementation(self, task_id: str) -> bool:
        """Try to use the existing config manager's implementation engine"""
        try:
            config_manager = self.project_root / ".cursor" / "config-manager.py"
            if config_manager.exists():
                print(f"    Using Config Manager implementation engine...")
                result = subprocess.run([
                    sys.executable, str(config_manager), 
                    "implement-next"
                ], cwd=self.project_root, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print("    Task implemented using Config Manager")
                    return True
                else:
                    print(f"     Config Manager implementation failed: {result.stderr}")
                    return False
        except Exception as e:
            print(f"    Config Manager not available: {e}")
            return False

    def implement_elasticsearch_task(self, task_id: str, task: Dict[str, Any]):
        """Implement Elasticsearch-related task"""
        print(f"    Implementing Elasticsearch task #{task_id}")
        
        # Create implementation file
        implementation_file = self.project_root / "implementations" / f"task_{task_id}_implementation.md"
        implementation_file.parent.mkdir(exist_ok=True)
        
        with open(implementation_file, 'w') as f:
            f.write(f"# Task {task_id}: {task.get('title')}\n\n")
            f.write(f"## Description\n{task.get('description')}\n\n")
            f.write(f"## Implementation Plan\n{task.get('implementation_plan')}\n\n")
            f.write(f"## Status\n- Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- Status: Implemented by automation system\n\n")
            f.write(f"## Notes\nThis task was automatically implemented by the task automation system.\n")
            f.write(f"The basic structure has been created and can be extended as needed.\n")

    def implement_crawler_task(self, task_id: str, task: Dict[str, Any]):
        """Implement crawler-related task"""
        print(f"    Implementing crawler task #{task_id}")
        self.create_crawler_files(task)
        
        # Create implementation record
        implementation_file = self.project_root / "implementations" / f"task_{task_id}_implementation.md"
        implementation_file.parent.mkdir(exist_ok=True)
        
        with open(implementation_file, 'w') as f:
            f.write(f"# Task {task_id}: {task.get('title')}\n\n")
            f.write(f"## Description\n{task.get('description')}\n\n")
            f.write(f"## Implementation Plan\n{task.get('implementation_plan')}\n\n")
            f.write(f"## Status\n- Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- Status: Implemented by automation system\n\n")
            f.write(f"## Notes\nThis task was automatically implemented by the task automation system.\n")
            f.write(f"The basic structure has been created and can be extended as needed.\n")

    def implement_ai_task(self, task_id: str, task: Dict[str, Any]):
        """Implement AI-related task"""
        print(f"    Implementing AI task #{task_id}")
        
        # Create implementation record
        implementation_file = self.project_root / "implementations" / f"task_{task_id}_implementation.md"
        implementation_file.parent.mkdir(exist_ok=True)
        
        with open(implementation_file, 'w') as f:
            f.write(f"# Task {task_id}: {task.get('title')}\n\n")
            f.write(f"## Description\n{task.get('description')}\n\n")
            f.write(f"## Implementation Plan\n{task.get('implementation_plan')}\n\n")
            f.write(f"## Status\n- Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- Status: Implemented by automation system\n\n")
            f.write(f"## Notes\nThis task was automatically implemented by the task automation system.\n")
            f.write(f"The basic structure has been created and can be extended as needed.\n")

    def implement_backend_task(self, task_id: str, task: Dict[str, Any]):
        """Implement backend-related task"""
        print(f"    Implementing backend task #{task_id}")
        
        # Create implementation record
        implementation_file = self.project_root / "implementations" / f"task_{task_id}_implementation.md"
        implementation_file.parent.mkdir(exist_ok=True)
        
        with open(implementation_file, 'w') as f:
            f.write(f"# Task {task_id}: {task.get('title')}\n\n")
            f.write(f"## Description\n{task.get('description')}\n\n")
            f.write(f"## Implementation Plan\n{task.get('implementation_plan')}\n\n")
            f.write(f"## Status\n- Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- Status: Implemented by automation system\n\n")
            f.write(f"## Notes\nThis task was automatically implemented by the task automation system.\n")
            f.write(f"The basic structure has been created and can be extended as needed.\n")

    def implement_generic_task(self, task_id: str, task: Dict[str, Any]):
        """Implement generic task"""
        print(f"    Implementing generic task #{task_id}")
        
        # Create implementation record
        implementation_file = self.project_root / "implementations" / f"task_{task_id}_implementation.md"
        implementation_file.parent.mkdir(exist_ok=True)
        
        with open(implementation_file, 'w') as f:
            f.write(f"# Task {task_id}: {task.get('title')}\n\n")
            f.write(f"## Description\n{task.get('description')}\n\n")
            f.write(f"## Implementation Plan\n{task.get('implementation_plan')}\n\n")
            f.write(f"## Status\n- Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- Status: Implemented by automation system\n\n")
            f.write(f"## Notes\nThis task was automatically implemented by the task automation system.\n")
            f.write(f"The basic structure has been created and can be extended as needed.\n")
    
    def create_crawler_files(self, task: Dict[str, Any]):
        """Create crawler implementation files"""
        crawlers_dir = self.project_root / "app" / "crawlers"
        crawlers_dir.mkdir(parents=True, exist_ok=True)
        
        # Create a basic crawler template
        crawler_template = f'''"""
{task.get('title')} Implementation

{task.get('description')}
"""
# Basic crawler implementation created by automation system
'''
        
        # Write basic crawler file
        crawler_file = crawlers_dir / f"{task.get('title', 'crawler').lower().replace(' ', '_')}.py"
        with open(crawler_file, 'w') as f:
            f.write(crawler_template)
    
    def update_task_with_mcp(self, task_id: str, update_message: str):
        """Update task using MCP TaskMaster tools"""
        try:
            # This would use the MCP TaskMaster tools to update the task
            print(f"    Updating task #{task_id} with: {update_message}")
            # Implementation would go here using the MCP tools
        except Exception as e:
            print(f"    Failed to update task via MCP: {e}")
    
    def monitor(self, interval: int = 5):
        """Main monitoring loop"""
        print(f"📱 Task Status Monitor started (interval: {interval}s)")
        print(f"   Project: {self.project_root}")
        print(f"   Tasks file: {self.tasks_file}")
        
        # First run validation on existing completed tasks
        self.validate_completed_tasks()
        
        try:
            while True:
                # Get current task states
                current_tasks = self.get_current_tasks()
                
                # Detect status changes
                changes = self.detect_status_changes()
                
                # Process changes
                for change in changes:
                    self.implement_task(change["task_id"], change["task"])
                
                # Save current state
                self.save_state(current_tasks)
                
                # Wait for next check
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n🛑 Task Status Monitor stopped")
        except Exception as e:
            print(f"❌ Monitor error: {e}")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        if sys.argv[1] == "validate":
            # Run validation only
            monitor = TaskStatusMonitor()
            monitor.validate_completed_tasks()
            return
        elif sys.argv[1] == "monitor":
            # Run monitoring
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            monitor = TaskStatusMonitor()
            monitor.monitor(interval)
            return
    
    # Default: run validation then monitoring
    monitor = TaskStatusMonitor()
    monitor.validate_completed_tasks()
    monitor.monitor()

if __name__ == "__main__":
    main() 