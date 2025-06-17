#!/usr/bin/env python3
"""
Fix Task Validation - Specifically validates and fixes tasks 4-8 database implementations
"""
import sys
import os
from pathlib import Path
import json
import subprocess

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Import the TaskStatusMonitor class directly
import importlib.util
spec = importlib.util.spec_from_file_location("task_status_monitor", Path(__file__).parent / "task-status-monitor.py")
task_status_monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(task_status_monitor)
TaskStatusMonitor = task_status_monitor.TaskStatusMonitor

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
TASKS_FILE = PROJECT_ROOT / '.taskmaster/tasks/tasks.json'

class TaskValidator:
    """
    Validates a task by checking code existence, quality,
    running tests, and verifying dependencies.
    """
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.task_data = self._get_task_data()
        self.validation_errors = []

    def _get_task_data(self) -> dict:
        """Loads task data from the central tasks JSON file."""
        if not TASKS_FILE.exists():
            raise FileNotFoundError(f"Tasks file not found at {TASKS_FILE}")
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            tasks = json.load(f)
        
        task = tasks.get(self.task_id)
        if not task:
            raise ValueError(f"Task with ID '{self.task_id}' not found in {TASKS_FILE}.")
        return task

    def validate(self) -> bool:
        """Runs all validation checks."""
        print(f"--- Starting validation for task: {self.task_id} ---")
        self._validate_code_existence()
        self._validate_code_quality()
        self._validate_functional_tests()
        self._validate_dependencies()

        if self.validation_errors:
            print(f"\n--- Validation FAILED for task: {self.task_id} ---")
            for error in self.validation_errors:
                print(f"[ERROR] {error}")
            return False
        else:
            print(f"\n--- Validation SUCCEEDED for task: {self.task_id} ---")
            return True

    def _validate_code_existence(self):
        """Checks if specified implementation files exist."""
        print("\n1. Validating code existence...")
        implementation_files = self.task_data.get('implementation_files', [])
        if not implementation_files:
            self.validation_errors.append("No implementation files specified for the task.")
            return

        for file_path in implementation_files:
            full_path = PROJECT_ROOT / file_path
            if not full_path.exists():
                self.validation_errors.append(f"Implementation file does not exist: {file_path}")
            elif not full_path.is_file():
                self.validation_errors.append(f"Implementation path is not a file: {file_path}")
        print("Code existence check complete.")

    def _validate_code_quality(self):
        """Performs basic checks on file size and content."""
        print("\n2. Validating code quality...")
        implementation_files = self.task_data.get('implementation_files', [])
        if not implementation_files:
            return

        for file_path in implementation_files:
            full_path = PROJECT_ROOT / file_path
            if not full_path.exists():
                continue

            if full_path.stat().st_size < 50:
                self.validation_errors.append(f"File '{file_path}' is very small ({full_path.stat().st_size} bytes), may be a stub.")

            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "TODO" in content or "NotImplementedError" in content:
                        self.validation_errors.append(f"File '{file_path}' contains placeholders like TODO or NotImplementedError.")
            except Exception as e:
                self.validation_errors.append(f"Could not read file '{file_path}': {e}")
        print("Code quality check complete.")

    def _validate_functional_tests(self):
        """Runs pytest on specified test files."""
        print("\n3. Validating functional tests...")
        test_files = self.task_data.get('test_files', [])
        if not test_files:
            print("No functional tests specified for this task. Skipping.")
            return

        valid_test_files = []
        for test_file in test_files:
            if (PROJECT_ROOT / test_file).exists():
                valid_test_files.append(test_file)
            else:
                self.validation_errors.append(f"Test file not found: {test_file}")
        
        if not valid_test_files:
            return

        print(f"Running pytest for: {', '.join(valid_test_files)}")
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'pytest', *valid_test_files],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
                check=True,
                timeout=300
            )
            print("Pytest execution successful.")
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            self.validation_errors.append(f"Pytest execution failed for {valid_test_files}.")
            self.validation_errors.append(f"Stderr: {e.stderr}")
        except subprocess.TimeoutExpired:
            self.validation_errors.append("Pytest execution timed out.")

    def _validate_dependencies(self):
        """Validates task and package dependencies."""
        print("\n4. Validating dependencies...")
        
        # Task-to-task dependencies
        dependencies = self.task_data.get('dependencies', [])
        if dependencies:
            with open(TASKS_FILE, 'r', encoding='utf-8') as f:
                all_tasks = json.load(f)
            for dep_id in dependencies:
                dep_task = all_tasks.get(dep_id)
                if not dep_task:
                    self.validation_errors.append(f"Dependency task '{dep_id}' not found in tasks file.")
                    continue
                
                if dep_task.get('status') != 'completed':
                    self.validation_errors.append(f"Dependency task '{dep_id}' is not completed. Current status: {dep_task.get('status')}")
        
        # Python package dependencies
        print("Checking python package dependencies with 'pip check'...")
        try:
            subprocess.run(
                [sys.executable, '-m', 'pip', 'check'], 
                capture_output=True, text=True, check=True
            )
            print("'pip check' successful.")
        except subprocess.CalledProcessError as e:
            self.validation_errors.append(f"'pip check' failed, indicating broken dependencies:\n{e.stderr}")
        print("Dependency check complete.")

def main():
    """Main function to validate and fix database tasks"""
    print("🔧 Database Task Validation & Fix Tool")
    print("=" * 50)
    
    monitor = TaskStatusMonitor(project_root)
    
    # Focus on database tasks 4-8
    database_tasks = ["4", "5", "6", "7", "8"]
    
    print("📋 Validating Database Tasks (4-8):")
    print("   Task 4: PostgreSQL database and schema")
    print("   Task 5: MongoDB for document storage") 
    print("   Task 6: Redis for caching and session management")
    print("   Task 7: Qdrant vector database for semantic search")
    print("   Task 8: Elasticsearch for lexical search")
    print()
    
    current_tasks = monitor.get_current_tasks()
    validation_summary = {}
    
    for task_id in database_tasks:
        if task_id in current_tasks:
            task = current_tasks[task_id]
            print(f"🔍 Validating Task #{task_id}: {task.get('title')}")
            print(f"   Current Status: {task.get('status')}")
            
            # Verify implementation
            validator = TaskValidator(task_id)
            verification = validator.validate()
            validation_summary[task_id] = verification
            
            if verification:
                print(f"   ✅ IMPLEMENTATION FOUND")
                for detail in validator.validation_errors:
                    print(f"      • {detail}")
                print(f"      Files found: {', '.join(validator.task_data.get('implementation_files', []))}")
                
                # If task is not marked as done, update it
                if task.get("status") != "done":
                    print(f"   🔧 Updating status to 'done'...")
                    try:
                        monitor.update_task_status_to_done(task_id)
                        print(f"   ✅ Task #{task_id} status updated to 'done'")
                    except Exception as e:
                        print(f"   ❌ Failed to update status: {e}")
                else:
                    print(f"   ✅ Status already correctly set to 'done'")
            else:
                print(f"   ❌ IMPLEMENTATION MISSING")
                if validator.validation_errors:
                    print(f"      Validation errors: {', '.join(validator.validation_errors)}")
                
                # If task is marked as done but not implemented, revert status
                if task.get("status") == "done":
                    print(f"   🔧 Reverting status from 'done' to 'todo'...")
                    try:
                        monitor.revert_task_status(task_id, "todo", "Implementation not found")
                        print(f"   ✅ Task #{task_id} status reverted to 'todo'")
                    except Exception as e:
                        print(f"   ❌ Failed to revert status: {e}")
            
            print()
        else:
            print(f"❌ Task #{task_id} not found in tasks file")
            print()
    
    # Summary report
    print("📊 VALIDATION SUMMARY")
    print("=" * 30)
    implemented_count = sum(1 for v in validation_summary.values() if v)
    total_count = len(validation_summary)
    
    print(f"Tasks validated: {total_count}")
    print(f"Properly implemented: {implemented_count}")
    print(f"Missing implementations: {total_count - implemented_count}")
    print()
    
    if implemented_count == total_count:
        print("🎉 ALL DATABASE TASKS ARE PROPERLY IMPLEMENTED!")
        print("   The automation system was incorrectly marking tasks.")
        print("   Task statuses have been corrected.")
    else:
        print("⚠️  Some database tasks need implementation work:")
        for task_id, verification in validation_summary.items():
            if not verification:
                task = current_tasks.get(task_id, {})
                print(f"   Task #{task_id}: {task.get('title')} - Validation errors: {', '.join(validator.validation_errors)}")
    
    print()
    print("✅ Validation and fix process completed!")

if __name__ == "__main__":
    main() 