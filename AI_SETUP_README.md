# AI Model Setup Guide

This guide explains how to configure and use the real AI APIs in your legal platform.

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
   npm run setup:ai
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## 🎯 Available Models

The system is configured to use only these specific high-performance models:

### 1. **GPT-4o Mini (High)** - OpenAI
- **Model ID:** `gpt-4o-mini`
- **Use Case:** General purpose, fast responses
- **Context Window:** 128,000 tokens
- **Cost:** $0.00015 input / $0.0006 output per 1K tokens

### 2. **Claude 4 Sonnet Thinking** - Anthropic
- **Model ID:** `claude-3-5-sonnet-20241022` (will be updated when Claude 4 is released)
- **Use Case:** Complex reasoning, legal analysis
- **Context Window:** 200,000 tokens
- **Cost:** $0.003 input / $0.015 output per 1K tokens

### 3. **Gemini 2.5 Pro (06.25)** - Google
- **Model ID:** `gemini-2.0-flash-exp` (will be updated when 2.5 Pro is released)
- **Use Case:** Large context, multimodal tasks
- **Context Window:** 2,000,000 tokens
- **Cost:** $0.00125 input / $0.005 output per 1K tokens

### 4. **Deepseek R1 (0528)** - Deepseek
- **Model ID:** `deepseek-r1`
- **Use Case:** Cost-effective, powerful reasoning
- **Context Window:** 64,000 tokens
- **Cost:** $0.0014 input / $0.0028 output per 1K tokens

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

## 🛠️ Configuration Management

### Using the CLI
```bash
# Test all configurations
npm run setup:ai

# Show configuration only
npm run setup:ai -- --config-only

# Test services only
npm run setup:ai -- --test-only
```

### Using the Web UI
1. Navigate to `/ai-setup` in your application
2. Manage API keys in the "API Keys" tab
3. Add/edit/delete models in the "Models" tab
4. Test connections in the "Testing" tab

## 💻 Usage Examples

### Basic Usage
```typescript
import { createDefaultAI, createTaskAI, createAIService } from '@/llm/ai-factory';

// Use default configured model
const ai = createDefaultAI();
const response = await ai.generate('Analyze this contract clause...');

// Use task-optimized models
const legalAI = createTaskAI('analysis');
const codingAI = createTaskAI('coding');

// Use specific models
const claude = createAIService('claude', 'claude-4-sonnet-thinking');
const gpt = createAIService('openai', 'gpt-4o-mini-high');
```

### Advanced Configuration
```typescript
import { AIService } from '@/llm/ai-service';

// Custom configuration
const customAI = new AIService({
  provider: 'claude',
  apiKey: 'your-key',
  model: 'claude-4-sonnet-thinking',
  temperature: 0.3,
  maxTokens: 8000
});

// Get detailed response with metadata
const result = await customAI.generateWithMetadata('Your prompt here');
console.log(result.tokenUsage); // Token usage information
console.log(result.provider);   // Model provider
```

### Task-Specific Models
```typescript
// Legal reasoning (uses Claude Sonnet)
const legalAI = createTaskAI('reasoning');

// Code analysis (uses GPT-4o Mini)
const codeAI = createTaskAI('coding');

// Document analysis (uses Claude with higher context)
const analysisAI = createTaskAI('analysis');

// Translation (uses Gemini)
const translationAI = createTaskAI('translation');

// Creative writing (uses higher temperature)
const creativeAI = createTaskAI('creative');
```

## 🧪 Testing and Validation

### Automatic Testing
The setup script automatically tests all configured models:

```bash
npm run setup:ai
```

### Manual Testing
```typescript
import { aiFactory } from '@/llm/ai-factory';

// Test all services
const results = await aiFactory.testAllServices();
console.log(results); // Map of provider -> boolean

// Test specific service
const claude = aiFactory.createService('claude');
const isWorking = await claude.testConnection();
```

### Health Checks
```typescript
import { aiConfig } from '@/config/ai-config';

// Check configuration
const validation = aiConfig.validateConfiguration();
if (!validation.valid) {
  console.log('Issues:', validation.errors);
}

// Get available providers
const providers = aiConfig.getAvailableProviders();
console.log('Available:', providers);
```

## 🔧 Customization

### Adding Custom Models
You can add custom models through the UI or programmatically:

```typescript
// Add to AI_MODELS in src/config/ai-config.ts
export const AI_MODELS = {
  'my-custom-model': {
    provider: 'openai',
    model: 'gpt-4-custom',
    displayName: 'My Custom Model',
    contextWindow: 32000,
    costPer1kTokens: { input: 0.01, output: 0.02 }
  }
};
```

### Environment Variables
All configuration can be controlled via environment variables:

```bash
# Default provider
DEFAULT_AI_PROVIDER=claude
VITE_DEFAULT_AI_PROVIDER=claude

# Default model
DEFAULT_AI_MODEL=claude-4-sonnet-thinking
VITE_DEFAULT_AI_MODEL=claude-4-sonnet-thinking
```

## 📊 Monitoring and Analytics

### Token Usage Tracking
```typescript
const result = await ai.generateWithMetadata('Your prompt');
console.log(`Tokens used: ${result.tokenUsage?.totalTokens}`);
console.log(`Cost: $${result.tokenUsage?.totalTokens * 0.001}`);
```

### Performance Monitoring
```typescript
import { aiFactory } from '@/llm/ai-factory';

// Get cache statistics
const stats = aiFactory.getCacheStats();
console.log(`Cached services: ${stats.size}`);

// Clear cache if needed
aiFactory.clearCache();
```

## 🚨 Troubleshooting

### Common Issues

1. **"No API key found"**
   - Check your `.env` file
   - Ensure both `API_KEY` and `VITE_API_KEY` variables are set
   - Restart the development server

2. **"API request failed"**
   - Verify your API key is valid
   - Check you have sufficient credits
   - Test with a simple prompt first

3. **"Model not found"**
   - Verify the model ID is correct
   - Check if the model is available in your region
   - Try a different model from the same provider

### Debug Mode
Enable debug logging:
```typescript
// Enable detailed logging
console.log('AI Config:', aiConfig.printConfiguration());
```

### Support
- Check model availability at provider documentation
- Verify API key permissions
- Monitor rate limits and quotas

## 📄 License and Terms

- Ensure you comply with each AI provider's terms of service
- Monitor usage to avoid unexpected costs
- Implement proper rate limiting for production use

---

**Ready to start?** Run `npm run setup:ai` to begin! 