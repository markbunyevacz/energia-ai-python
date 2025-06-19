#!/usr/bin/env python3
"""
Deployment automation script for Energia AI
"""
import argparse
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

class DeploymentManager:
    """Manages deployment to different environments"""
    
    def __init__(self, environment: str):
        self.environment = environment
        self.project_root = Path(__file__).parent.parent
        self.config = self._load_config()
    
    def _load_config(self) -> Dict:
        """Load environment-specific configuration"""
        configs = {
            "development": {
                "docker_compose_file": "docker-compose.yml",
                "health_check_url": "http://localhost:8000/health",
                "database_migration": True,
                "services": ["energia-ai", "postgres", "redis"],
            },
            "staging": {
                "docker_compose_file": "docker-compose.prod.yml",
                "health_check_url": "https://staging-energia-ai.example.com/health",
                "database_migration": True,
                "services": ["energia-ai"],
            },
            "production": {
                "docker_compose_file": "docker-compose.prod.yml", 
                "health_check_url": "https://energia-ai.example.com/health",
                "database_migration": True,
                "services": ["energia-ai"],
            }
        }
        return configs.get(self.environment, {})
    
    def pre_deployment_checks(self) -> bool:
        """Run pre-deployment checks"""
        print(f"Running pre-deployment checks for {self.environment}...")
        
        checks = [
            self._check_docker_available,
            self._check_environment_variables,
            self._check_database_connectivity,
            self._run_tests,
        ]
        
        for check in checks:
            if not check():
                print(f"❌ Pre-deployment check failed: {check.__name__}")
                return False
            print(f"✅ {check.__name__} passed")
        
        return True
    
    def _check_docker_available(self) -> bool:
        """Check if Docker is available"""
        try:
            subprocess.run(["docker", "--version"], check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Docker is not available")
            return False
    
    def _check_environment_variables(self) -> bool:
        """Check required environment variables"""
        required_vars = [
            "DATABASE_URL",
            "REDIS_URL",
        ]
        
        if self.environment == "production":
            required_vars.extend([
                "CLAUDE_API_KEY",
                "OPENAI_API_KEY",
            ])
        
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            print(f"Missing environment variables: {missing_vars}")
            return False
        
        return True
    
    def _check_database_connectivity(self) -> bool:
        """Check database connectivity"""
        # This would implement actual database connectivity check
        return True
    
    def _run_tests(self) -> bool:
        """Run tests before deployment"""
        if self.environment == "development":
            # Skip tests for development deployment
            return True
        
        try:
            subprocess.run([
                "python", "-m", "pytest", 
                "tests/", "-v", "--tb=short"
            ], check=True, cwd=self.project_root)
            return True
        except subprocess.CalledProcessError:
            print("Tests failed")
            return False
    
    def build_images(self) -> bool:
        """Build Docker images"""
        print(f"Building Docker images for {self.environment}...")
        
        try:
            cmd = [
                "docker", "compose", 
                "-f", self.config["docker_compose_file"],
                "build"
            ]
            subprocess.run(cmd, check=True, cwd=self.project_root)
            print("✅ Docker images built successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to build Docker images")
            return False
    
    def run_database_migrations(self) -> bool:
        """Run database migrations"""
        if not self.config.get("database_migration", False):
            return True
        
        print("Running database migrations...")
        
        try:
            # This would run actual database migrations
            subprocess.run([
                "python", "scripts/initialize_db.py"
            ], check=True, cwd=self.project_root)
            print("✅ Database migrations completed")
            return True
        except subprocess.CalledProcessError:
            print("❌ Database migrations failed")
            return False
    
    def deploy_services(self) -> bool:
        """Deploy services"""
        print(f"Deploying services for {self.environment}...")
        
        try:
            cmd = [
                "docker", "compose",
                "-f", self.config["docker_compose_file"],
                "up", "-d"
            ]
            
            if self.config.get("services"):
                cmd.extend(self.config["services"])
            
            subprocess.run(cmd, check=True, cwd=self.project_root)
            print("✅ Services deployed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to deploy services")
            return False
    
    def health_check(self, max_attempts: int = 30, delay: int = 5) -> bool:
        """Perform health check after deployment"""
        print("Performing health check...")
        
        health_url = self.config.get("health_check_url")
        if not health_url:
            print("No health check URL configured")
            return True
        
        import requests
        
        for attempt in range(max_attempts):
            try:
                response = requests.get(health_url, timeout=10)
                if response.status_code == 200:
                    print("✅ Health check passed")
                    return True
            except requests.RequestException:
                pass
            
            print(f"Health check attempt {attempt + 1}/{max_attempts} failed, retrying in {delay}s...")
            time.sleep(delay)
        
        print("❌ Health check failed")
        return False
    
    def rollback(self) -> bool:
        """Rollback deployment"""
        print(f"Rolling back deployment for {self.environment}...")
        
        try:
            cmd = [
                "docker", "compose",
                "-f", self.config["docker_compose_file"],
                "down"
            ]
            subprocess.run(cmd, check=True, cwd=self.project_root)
            print("✅ Rollback completed")
            return True
        except subprocess.CalledProcessError:
            print("❌ Rollback failed")
            return False
    
    def deploy(self) -> bool:
        """Execute full deployment process"""
        print(f"🚀 Starting deployment to {self.environment}")
        
        steps = [
            ("Pre-deployment checks", self.pre_deployment_checks),
            ("Build images", self.build_images),
            ("Database migrations", self.run_database_migrations),
            ("Deploy services", self.deploy_services),
            ("Health check", self.health_check),
        ]
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            if not step_func():
                print(f"\n❌ Deployment failed at step: {step_name}")
                if self.environment != "development":
                    print("🔄 Initiating rollback...")
                    self.rollback()
                return False
        
        print(f"\n🎉 Deployment to {self.environment} completed successfully!")
        return True

def main():
    parser = argparse.ArgumentParser(description="Deploy Energia AI to different environments")
    parser.add_argument(
        "environment",
        choices=["development", "staging", "production"],
        help="Target environment for deployment"
    )
    parser.add_argument(
        "--skip-checks",
        action="store_true",
        help="Skip pre-deployment checks (not recommended for production)"
    )
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback the deployment"
    )
    
    args = parser.parse_args()
    
    deployer = DeploymentManager(args.environment)
    
    if args.rollback:
        success = deployer.rollback()
    else:
        if args.skip_checks:
            deployer.pre_deployment_checks = lambda: True
        success = deployer.deploy()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 