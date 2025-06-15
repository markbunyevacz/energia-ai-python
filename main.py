"""
JogiAIPython - Legal AI Application
Main entry point for the Python-based legal intelligence platform.
"""

import sys
from config import get_supabase_client, test_connection

def main():
    """Main entry point for the JogiAIPython application."""
    
    print("=" * 60)
    print("🏛️  JogiAIPython - Legal AI Platform")
    print("=" * 60)
    
    # Test Supabase connection
    print("\n🔍 Initializing Supabase connection...")
    if not test_connection():
        print("\n❌ Failed to connect to Supabase!")
        print("📝 Please check your .env file and ensure:")
        print("   - SUPABASE_ANON_KEY is set correctly")
        print("   - SUPABASE_SERVICE_KEY is set correctly")
        print("   - Project ID is correct: mlgwqkedrmezbbdzpqey")
        print("\n📖 See SETUP.md for detailed instructions.")
        sys.exit(1)
    
    print("\n✅ Database connection established!")
    
    # Initialize the application
    print("\n🚀 Starting JogiAIPython application...")
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Example: Try to access profiles table
    try:
        print("\n📊 Checking database tables...")
        
        # Test profiles table access
        profiles_response = supabase.from_('profiles').select('id').limit(1).execute()
        print(f"✅ Profiles table accessible")
        
    except Exception as e:
        print(f"⚠️  Database table access issue: {str(e)}")
        print("💡 This is normal for a new database - tables need to be created.")
    
    print("\n🎯 Application initialized successfully!")
    print("🔧 Ready for development!")
    
    # TODO: Add your application logic here
    print("\n📝 Next steps:")
    print("   1. Create database schema")
    print("   2. Implement authentication")
    print("   3. Build AI analysis features")
    print("   4. Add API endpoints")

if __name__ == "__main__":
    main() 