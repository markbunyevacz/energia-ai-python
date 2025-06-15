"""
Supabase Configuration for JogiAIPython
Project ID: mlgwqkedrmezbbdzpqey
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = "https://mlgwqkedrmezbbdzpqey.supabase.co"
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "your_anon_key_here")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "your_service_role_key_here")

# Application Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
API_PORT = int(os.getenv("API_PORT", "8000"))
API_HOST = os.getenv("API_HOST", "localhost")

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    
    Returns:
        Client: Configured Supabase client
    """
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_supabase_admin_client() -> Client:
    """
    Create and return a Supabase admin client instance with service role key.
    
    Returns:
        Client: Configured Supabase admin client
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Test connection function
def test_connection():
    """Test the Supabase connection."""
    try:
        supabase = get_supabase_client()
        # Try to fetch from a system table to test connection
        response = supabase.from_('information_schema.tables').select('table_name').limit(1).execute()
        print("✅ Supabase connection successful!")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"🚀 JogiAIPython Configuration")
    print(f"📡 Supabase URL: {SUPABASE_URL}")
    print(f"🔧 Environment: {ENVIRONMENT}")
    print(f"🐛 Debug mode: {DEBUG}")
    print(f"🌐 API Host: {API_HOST}:{API_PORT}")
    print("\n🔍 Testing connection...")
    test_connection() 