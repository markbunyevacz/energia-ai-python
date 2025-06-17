#!/usr/bin/env python3
"""
Start Task Automation - Launches the task status monitor as a background service
"""
import subprocess
import sys
import os
import signal
import time
from pathlib import Path

class TaskAutomationService:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.monitor_script = self.project_root / "scripts" / "automation" / "task-status-monitor.py"
        self.pid_file = self.project_root / ".taskmaster" / "automation.pid"
        self.log_file = self.project_root / ".taskmaster" / "automation.log"
        
    def start(self, background=True):
        """Start the task automation monitor"""
        if self.is_running():
            print("Task automation is already running")
            return
        
        print("🚀 Starting Task Automation Service...")
        
        # Ensure directories exist
        self.pid_file.parent.mkdir(exist_ok=True)
        self.log_file.parent.mkdir(exist_ok=True)
        
        if background:
            # Start as background process
            with open(self.log_file, 'w') as log:
                process = subprocess.Popen([
                    sys.executable, str(self.monitor_script)
                ], 
                cwd=self.project_root,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True  # Detach from current session
                )
            
            # Save PID
            with open(self.pid_file, 'w') as f:
                f.write(str(process.pid))
            
            print(f"✅ Task automation started (PID: {process.pid})")
            print(f"   Log file: {self.log_file}")
            print(f"   Use 'python scripts/automation/start-task-automation.py stop' to stop")
        else:
            # Start in foreground
            subprocess.run([sys.executable, str(self.monitor_script)], 
                         cwd=self.project_root)
    
    def stop(self):
        """Stop the task automation monitor"""
        if not self.is_running():
            print("Task automation is not running")
            return
        
        try:
            with open(self.pid_file) as f:
                pid = int(f.read().strip())
            
            print(f"🛑 Stopping Task Automation Service (PID: {pid})...")
            
            if sys.platform == "win32":
                # Windows process termination
                try:
                    import psutil
                    process = psutil.Process(pid)
                    process.terminate()
                    process.wait(timeout=5)
                    print("   ✅ Process terminated gracefully")
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    print("   ⚠️  Process not found or access denied")
                except psutil.TimeoutExpired:
                    print("   ⚠️  Process didn't terminate gracefully, force killing...")
                    process.kill()
                except ImportError:
                    # Fallback to basic Windows termination
                    subprocess.run(['taskkill', '/PID', str(pid), '/F'], 
                                 capture_output=True)
            else:
                # Unix process termination
                # Try graceful shutdown first
                os.kill(pid, signal.SIGTERM)
                
                # Wait a bit and check if it's still running
                time.sleep(2)
                
                try:
                    os.kill(pid, 0)  # Check if process still exists
                    # If we get here, process is still running - force kill
                    print("   Process didn't respond to SIGTERM, force killing...")
                    os.kill(pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass  # Process already terminated
            
            # Clean up PID file
            self.pid_file.unlink()
            print("✅ Task automation stopped")
            
        except Exception as e:
            print(f"❌ Error stopping task automation: {e}")
            # Clean up PID file anyway
            if self.pid_file.exists():
                self.pid_file.unlink()
    
    def status(self):
        """Check the status of task automation"""
        if self.is_running():
            with open(self.pid_file) as f:
                pid = int(f.read().strip())
            print(f"✅ Task automation is running (PID: {pid})")
            
            # Show recent log entries
            if self.log_file.exists():
                print("\n📋 Recent log entries:")
                try:
                    with open(self.log_file) as f:
                        lines = f.readlines()
                        for line in lines[-10:]:  # Show last 10 lines
                            print(f"   {line.rstrip()}")
                except:
                    print("   Could not read log file")
        else:
            print("❌ Task automation is not running")
    
    def is_running(self):
        """Check if the task automation monitor is running"""
        if not self.pid_file.exists():
            return False
        
        try:
            with open(self.pid_file) as f:
                pid = int(f.read().strip())
            
            # Check if process exists (Windows compatible)
            if sys.platform == "win32":
                import psutil
                try:
                    process = psutil.Process(pid)
                    return process.is_running()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    return False
            else:
                os.kill(pid, 0)
                return True
        except (ValueError, ProcessLookupError, FileNotFoundError, ImportError):
            # PID file exists but process doesn't - clean up
            if self.pid_file.exists():
                self.pid_file.unlink()
            return False
    
    def restart(self):
        """Restart the task automation monitor"""
        print("🔄 Restarting Task Automation Service...")
        self.stop()
        time.sleep(1)
        self.start()

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Task Automation Service Manager")
    parser.add_argument(
        "action", 
        choices=["start", "stop", "restart", "status"],
        help="Action to perform"
    )
    parser.add_argument(
        "--foreground", 
        action="store_true",
        help="Run in foreground (only for start action)"
    )
    
    args = parser.parse_args()
    service = TaskAutomationService()
    
    if args.action == "start":
        service.start(background=not args.foreground)
    elif args.action == "stop":
        service.stop()
    elif args.action == "restart":
        service.restart()
    elif args.action == "status":
        service.status()

if __name__ == "__main__":
    main() 