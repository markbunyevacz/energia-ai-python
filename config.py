"""
Supabase Configuration for JogiAIPython
Project ID: mlgwqkedrmezbbdzpqey
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
import anthropic

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# Anthropic Configuration
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

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
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return supabase
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        sys.exit(1)

def get_supabase_admin_client() -> Client:
    """
    Create and return a Supabase admin client instance with service role key.
    
    Returns:
        Client: Configured Supabase admin client
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_anthropic_client() -> anthropic.Anthropic:
    """
    Returns an Anthropic client instance.
    
    This function initializes the Anthropic client using the API key.
    It's crucial that ANTHROPIC_API_KEY is set in your .env file.
    
    Returns:
        anthropic.Anthropic: An initialized Anthropic client instance.
    
    Raises:
        ValueError: If Anthropic API key is not configured.
        ConnectionError: If the client fails to initialize.
    """
    if not ANTHROPIC_API_KEY:
        raise ValueError("Anthropic API Key must be set in the environment.")
    
    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        return client
    except Exception as e:
        raise ConnectionError(f"Failed to create Anthropic client: {e}") from e

# Test connection function
def test_connection() -> bool:
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