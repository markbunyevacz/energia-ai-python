# 🚀 JogiAIPython Setup Guide

## 📋 Supabase Project Details
- **Project Name**: JogiAIPython
- **Project ID**: `mlgwqkedrmezbbdzpqey`
- **URL**: `https://mlgwqkedrmezbbdzpqey.supabase.co`

## 🔧 Initial Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get Your Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **JogiAIPython** project
3. Go to **Settings → API**
4. Copy the following keys:
   - **Project URL**: `https://mlgwqkedrmezbbdzpqey.supabase.co`
   - **anon public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (starts with eyJ)

### 3. Create Environment File

Create a `.env` file in the project root:

```env
# Supabase Configuration for JogiAIPython
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Application Configuration
ENVIRONMENT=development
DEBUG=True
API_PORT=8000
API_HOST=localhost
```

**⚠️ Important**: Replace `your_anon_key_here` and `your_service_role_key_here` with your actual keys from Supabase!

### 4. Test Connection

Run the configuration test:

```bash
python config.py
```

You should see:
```
🚀 JogiAIPython Configuration
📡 Supabase URL: https://mlgwqkedrmezbbdzpqey.supabase.co
🔧 Environment: development
🐛 Debug mode: True
🌐 API Host: localhost:8000

🔍 Testing connection...
✅ Supabase connection successful!
```

## 🏗️ Database Schema Setup

The project expects the following database structure (based on the original TypeScript version):

### Core Tables:
- `profiles` - User profiles
- `user_roles` - Role-based access control
- `contracts` - Legal contracts
- `analyses` - AI analysis results

### Setting up the schema:

1. **Option A**: Import from existing backup
2. **Option B**: Create manually in Supabase Dashboard
3. **Option C**: Use migration files (if available)

## 🐍 Usage Example

```python
from config import get_supabase_client

# Get client
supabase = get_supabase_client()

# Example: Fetch user profiles
try:
    response = supabase.from_('profiles').select('*').execute()
    print(f"Found {len(response.data)} profiles")
except Exception as e:
    print(f"Error: {e}")
```

## 🔐 Security Notes

- Never commit your `.env` file to git
- Use environment variables in production
- The `service_role` key has admin privileges - use carefully
- Enable Row Level Security (RLS) on all tables

## 📝 Next Steps

1. ✅ Setup environment variables
2. ✅ Test connection
3. 🔄 Create/import database schema
4. 🔄 Implement authentication
5. 🔄 Build AI analysis features

## 🆘 Troubleshooting

### Connection Issues:
- Check if Supabase project is active
- Verify API keys are correct
- Ensure project ID matches URL

### Import Issues:
- Install missing dependencies: `pip install supabase python-dotenv`
- Check Python version (3.8+ recommended)

---

**🎯 Ready to code!** Once the connection test passes, you're ready to start building your Python legal AI application! 