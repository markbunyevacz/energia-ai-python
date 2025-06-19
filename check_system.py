"""
Simple system check for Energia AI
Verifies dependencies and configuration without running complex code
"""
import os
import sys

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    if version.major >= 3 and version.minor >= 8:
        print("✅ Python version is compatible")
        return True
    else:
        print("❌ Python 3.8+ required")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'anthropic',
        'asyncio',
        'structlog',
        'pydantic',
        'pydantic_settings'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - not installed")
            missing.append(package)
    
    return len(missing) == 0, missing

def check_environment():
    """Check environment configuration"""
    # Check for .env file
    if os.path.exists('.env'):
        print("✅ .env file found")
        env_exists = True
    else:
        print("❌ .env file not found")
        env_exists = False
    
    # Check for API keys
    api_keys = ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY']
    api_key_found = False
    
    for key in api_keys:
        if os.getenv(key):
            print(f"✅ {key} found in environment")
            api_key_found = True
            break
    
    if not api_key_found:
        print("❌ No Claude API key found in environment")
        print("   Set ANTHROPIC_API_KEY or CLAUDE_API_KEY")
    
    return env_exists and api_key_found

def check_project_structure():
    """Check project structure"""
    required_dirs = [
        'src/energia_ai',
        'src/energia_ai/ai',
        'src/energia_ai/config'
    ]
    
    required_files = [
        'src/energia_ai/ai/claude_client.py',
        'src/energia_ai/config/settings.py'
    ]
    
    structure_ok = True
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            print(f"✅ Directory: {dir_path}")
        else:
            print(f"❌ Directory missing: {dir_path}")
            structure_ok = False
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ File: {file_path}")
        else:
            print(f"❌ File missing: {file_path}")
            structure_ok = False
    
    return structure_ok

def main():
    """Run all system checks"""
    print("🔍 ENERGIA AI SYSTEM CHECK")
    print("=" * 50)
    
    checks = {
        "Python Version": check_python_version(),
        "Project Structure": check_project_structure()
    }
    
    # Check dependencies
    print("\n📦 Checking Dependencies:")
    deps_ok, missing = check_dependencies()
    checks["Dependencies"] = deps_ok
    
    # Check environment
    print("\n🔧 Checking Environment:")
    env_ok = check_environment()
    checks["Environment"] = env_ok
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SYSTEM CHECK SUMMARY")
    print("=" * 50)
    
    all_ok = True
    for check_name, status in checks.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {check_name}")
        if not status:
            all_ok = False
    
    print("\n" + "=" * 50)
    if all_ok:
        print("🎉 ALL CHECKS PASSED! Your system is ready.")
    else:
        print("⚠️  SOME CHECKS FAILED. Please fix the issues above.")
        
        # Provide specific instructions
        if not checks["Dependencies"]:
            print("\n💡 To install missing dependencies:")
            print("   pip install -r requirements.txt")
            print("   or manually install missing packages")
        
        if not checks["Environment"]:
            print("\n💡 To fix environment:")
            print("   1. Copy env.template to .env")
            print("   2. Add your ANTHROPIC_API_KEY to .env")
            print("   3. Get API key from: https://console.anthropic.com/")
    
    print("\n" + "=" * 50)
    return all_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 