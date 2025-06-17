# AI Model Setup Guide - Python Backend

This guide explains how to configure and use AI APIs in your Python-based legal platform.

## 🚀 Quick Start

1. **Copy the environment template:**
   ```bash
   cp env.template .env
   ```

2. **Add your API keys to the `.env` file:**
   ```bash
   # Required API Keys
   OPENAI_API_KEY=sk-your_openai_key_here
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
   GEMINI_API_KEY=your_gemini_key_here
   DEEPSEEK_API_KEY=sk-your_deepseek_key_here
   ```

3. **Test your configuration:**
   ```bash
   python config.py
   ```

4. **Start the application:**
   ```bash
   python main.py
   ```

## 🎯 Available Models

The system is configured to use these high-performance models:

### 1. **Claude 4 Sonnet** - Anthropic (Recommended)
- **Model ID:** `claude-sonnet-4-20250514`
- **Use Case:** Complex reasoning, legal analysis
- **Context Window:** 200,000 tokens
- **Best for:** Complex legal document analysis, multi-step reasoning, contract review
- **Special Feature:** Enhanced thinking capabilities for thorough analysis

### 2. **GPT-4o Mini** - OpenAI
- **Model ID:** `gpt-4o-mini`
- **Use Case:** General purpose, fast responses
- **Context Window:** 128,000 tokens
- **Best for:** Advanced legal queries, detailed summarization, research tasks
- **Special Feature:** Optimized for high-quality outputs

### 3. **Gemini 2.5 Pro** - Google (Backup)
- **Model ID:** `gemini-2.5-pro-exp`
- **Use Case:** Large context, multimodal tasks
- **Context Window:** 2,000,000 tokens
- **Best for:** Large document processing

### 4. **Deepseek R1 (0528)** - Deepseek
- **Model ID:** `deepseek-r1`
- **Use Case:** Cost-effective reasoning
- **Context Window:** 64,000 tokens
- **Best for:** Budget-conscious applications

## 🔑 Getting API Keys

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add credits to your account

### Anthropic (Claude)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Set up billing

### Google AI (Gemini)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enable the Generative AI API

### Deepseek
1. Visit [Deepseek Platform](https://platform.deepseek.com/api_keys)
2. Create a new API key
3. Add credits to your account

## 🛠️ Python Configuration

### Basic Usage
```python
import os
from openai import OpenAI
from anthropic import Anthropic

# Initialize clients
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
anthropic_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Use OpenAI GPT-4o (High Performance)
response = openai_client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze this contract clause..."}]
)

# Use Anthropic Claude 4 Sonnet (Thinking)
response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1000,
    messages=[{"role": "user", "content": "Analyze this contract clause..."}]
)
```

### Configuration Class Example
```python
import os
from dataclasses import dataclass

@dataclass
class AIConfig:
    openai_api_key: str = os.getenv('OPENAI_API_KEY')
    anthropic_api_key: str = os.getenv('ANTHROPIC_API_KEY')
    gemini_api_key: str = os.getenv('GEMINI_API_KEY')
    deepseek_api_key: str = os.getenv('DEEPSEEK_API_KEY')
    
    default_provider: str = os.getenv('DEFAULT_AI_PROVIDER', 'anthropic')
    default_model: str = os.getenv('DEFAULT_AI_MODEL', 'claude-3-5-sonnet-20241022')
    
    def validate(self):
        """Validate that required API keys are present"""
        if not self.openai_api_key:
            print("⚠️  OpenAI API key not found")
        if not self.anthropic_api_key:
            print("⚠️  Anthropic API key not found")
        # Add more validations as needed
```

### Legal-Specific Prompts
```python
LEGAL_PROMPTS = {
    "contract_analysis": """
    Analyze the following contract clause for potential risks and issues:
    
    Clause: {clause_text}
    
    Please provide:
    1. Risk assessment (High/Medium/Low)
    2. Key issues identified
    3. Recommended actions
    4. Compliance considerations
    """,
    
    "regulatory_check": """
    Check if the following practice complies with Hungarian energy regulations:
    
    Practice: {practice_description}
    
    Please provide:
    1. Compliance status
    2. Relevant regulations
    3. Potential violations
    4. Recommendations
    """
}

# Usage
def analyze_contract_clause(clause_text: str) -> str:
    prompt = LEGAL_PROMPTS["contract_analysis"].format(clause_text=clause_text)
    
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text
```

## 🧪 Testing and Validation

### Connection Testing
```python
def test_ai_connections():
    """Test all AI service connections"""
    results = {}
    
    # Test OpenAI GPT-4o (High Performance)
    try:
        openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        results['openai'] = True
        print("✅ OpenAI GPT-4o connection successful")
    except Exception as e:
        results['openai'] = False
        print(f"❌ OpenAI GPT-4o connection failed: {e}")
    
    # Test Anthropic Claude 4 Sonnet (Thinking)
    try:
        anthropic_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=10,
            messages=[{"role": "user", "content": "Hello"}]
        )
        results['anthropic'] = True
        print("✅ Anthropic Claude 4 Sonnet connection successful")
    except Exception as e:
        results['anthropic'] = False
        print(f"❌ Anthropic Claude 4 Sonnet connection failed: {e}")
    
    return results

# Run tests
if __name__ == "__main__":
    test_ai_connections()
```

## 🔧 Advanced Configuration

### Environment-Based Configuration
```python
import os
from enum import Enum

class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class AISettings:
    def __init__(self):
        self.environment = Environment(os.getenv('ENVIRONMENT', 'development'))
        
        # Adjust settings based on environment
        if self.environment == Environment.PRODUCTION:
            self.max_tokens = 4000
            self.temperature = 0.3
            self.timeout = 30
        else:
            self.max_tokens = 2000
            self.temperature = 0.1
            self.timeout = 10
    
    def get_model_config(self, task_type: str):
        """Get model configuration based on task type"""
        configs = {
            "legal_analysis": {
                "model": "claude-3-5-sonnet-20241022",  # Claude 4 Sonnet (Thinking)
                "temperature": 0.1,
                "max_tokens": 4000
            },
            "summarization": {
                "model": "gpt-4o-mini",
                "temperature": 0.3,
                "max_tokens": 1000
            },
            "research": {
                "model": "gemini-2.0-flash-exp",
                "temperature": 0.2,
                "max_tokens": 2000
            },
            "complex_reasoning": {
                "model": "claude-3-5-sonnet-20241022",  # Claude 4 Sonnet (Thinking)
                "temperature": 0.1,
                "max_tokens": 6000
            }
        }
        return configs.get(task_type, configs["legal_analysis"])
```

## 🔒 Security Best Practices

### API Key Management
```python
import os
from cryptography.fernet import Fernet

class SecureAPIKeys:
    def __init__(self):
        self.encryption_key = os.getenv('ENCRYPTION_KEY')
        self.cipher = Fernet(self.encryption_key) if self.encryption_key else None
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key for storage"""
        if self.cipher:
            return self.cipher.encrypt(api_key.encode()).decode()
        return api_key
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt API key for use"""
        if self.cipher:
            return self.cipher.decrypt(encrypted_key.encode()).decode()
        return encrypted_key
```

### Rate Limiting
```python
import time
from functools import wraps

def rate_limit(calls_per_minute: int):
    """Decorator to limit API calls per minute"""
    def decorator(func):
        calls = []
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            # Remove calls older than 1 minute
            calls[:] = [call_time for call_time in calls if now - call_time < 60]
            
            if len(calls) >= calls_per_minute:
                sleep_time = 60 - (now - calls[0])
                print(f"Rate limit reached. Sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
            
            calls.append(now)
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

# Usage
@rate_limit(calls_per_minute=10)
def call_ai_api(prompt: str):
    # Your AI API call here
    pass
```

## 📚 Integration Examples

### FastAPI Integration (Future)
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class AnalysisRequest(BaseModel):
    text: str
    analysis_type: str

@app.post("/analyze")
async def analyze_text(request: AnalysisRequest):
    try:
        # AI analysis logic here
        result = analyze_contract_clause(request.text)
        return {"analysis": result, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Supabase Integration
```python
from supabase import create_client, Client

class AIAnalysisService:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_ANON_KEY')
        )
        self.ai_config = AIConfig()
    
    def analyze_and_store(self, document_id: str, text: str):
        """Analyze text and store results in Supabase"""
        analysis = analyze_contract_clause(text)
        
        # Store analysis results
        result = self.supabase.table('analyses').insert({
            'document_id': document_id,
            'analysis_text': analysis,
            'created_at': 'now()',
            'model_used': self.ai_config.default_model
        }).execute()
        
        return result
```

---

## 🚀 Next Steps

1. **Set up your API keys** in the `.env` file
2. **Test connections** with `python config.py`
3. **Build your AI service layer** using the examples above
4. **Implement rate limiting** and error handling
5. **Add monitoring** and logging for production use

For more information, see the main [README.md](../README.md) and [SETUP.md](../SETUP.md) files. 