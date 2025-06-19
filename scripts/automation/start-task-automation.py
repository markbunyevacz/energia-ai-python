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
        
    def start(self, background=True, interval: int = 5):
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
                    sys.executable, str(self.monitor_script),
                    "monitor", f"--interval={interval}"
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
            subprocess.run([
                sys.executable, str(self.monitor_script),
                "monitor", f"--interval={interval}"
            ], cwd=self.project_root)
    
    def stop(self):
        """Stop the task automation monitor"""
        if not self.is_running():
            print("Task automation is not running")
            return
        
        try:
            with open(self.pid_file) as f:
                pid = int(f.read().strip())
            
            print(f"🛑 Stopping Task Automation Service (PID: {pid})...")
            
            try:
                import psutil
                process = psutil.Process(pid)
                # Terminate children first
                for child in process.children(recursive=True):
                    child.terminate()
                process.terminate()
                process.wait(timeout=5)
                print("   ✅ Process terminated gracefully")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                print("   ⚠️  Process not found or access denied")
            except psutil.TimeoutExpired:
                print("   ⚠️  Process didn't terminate gracefully, force killing...")
                process.kill()
            except ImportError:
                print("   ⚠️ psutil not found. Trying basic process termination.")
                if sys.platform == "win32":
                    subprocess.run(['taskkill', '/PID', str(pid), '/F'], capture_output=True)
                else:
                    os.kill(pid, signal.SIGTERM)
            
            # Clean up PID file
            if self.pid_file.exists():
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
            
            # Check if process exists
            import psutil
            try:
                process = psutil.Process(pid)
                return process.is_running() and process.status() != psutil.STATUS_ZOMBIE
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                # Stale PID file
                self.pid_file.unlink(missing_ok=True)
                return False
        except (ValueError, FileNotFoundError, ImportError):
            # PID file exists but process doesn't or psutil not installed
            if self.pid_file.exists():
                self.pid_file.unlink(missing_ok=True)
            return False
    
    def restart(self, interval: int = 5):
        """Restart the task automation monitor"""
        print("🔄 Restarting Task Automation Service...")
        self.stop()
        time.sleep(1)
        self.start(interval=interval)

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
    parser.add_argument(
        "-i", "--interval", 
        type=int, 
        default=5,
        help="Monitoring interval in seconds for the start/restart action"
    )
    
    args = parser.parse_args()
    service = TaskAutomationService()
    
    if args.action == "start":
        service.start(background=not args.foreground, interval=args.interval)
    elif args.action == "stop":
        service.stop()
    elif args.action == "restart":
        service.restart(interval=args.interval)
    elif args.action == "status":
        service.status()

if __name__ == "__main__":
    main() 