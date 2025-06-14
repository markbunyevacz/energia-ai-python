import { AIProvider } from '../llm/ai-service';

export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  displayName: string;
  contextWindow: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  // OpenAI Models - o4 mini (high)
  'o4-mini-high': {
    provider: 'openai',
    model: 'gpt-4o-mini-high', // o4 mini (high) model
    displayName: 'o4 mini (high)',
    contextWindow: 128000,
    costPer1kTokens: { input: 0.003, output: 0.012 }
  },

  // Claude Models - Claude 4 Sonnet Thinking
  'claude-4-sonnet-thinking': {
    provider: 'claude',
    model: 'claude-4-sonnet-thinking', // Will be updated when Claude 4 is available
    displayName: 'claude 4 sonnet thinking',
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },

  // Gemini Models - Gemini 2.5 Pro (06.25)
  'gemini-2.5-pro': {
    provider: 'gemini',
    model: 'gemini-2.5-pro', // Will be updated when 2.5 Pro is available
    displayName: 'gemini 2.5 pro (06.25)',
    contextWindow: 2000000,
    costPer1kTokens: { input: 0.00125, output: 0.005 }
  },

  // Deepseek Models - Deepseek R1 0528
  'deepseek-r1-0528': {
    provider: 'deepseek' as AIProvider,
    model: 'deepseek-r1-0528',
    displayName: 'Deepseek R1 0528',
    contextWindow: 64000,
    costPer1kTokens: { input: 0.0014, output: 0.0028 }
  }
};

export interface AIEnvironmentConfig {
  openaiApiKey?: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  defaultModel?: string;
  defaultProvider?: AIProvider;
}

export class AIConfigManager {
  private config: AIEnvironmentConfig;

  constructor() {
    this.config = this.loadFromEnvironment();
  }

  private loadFromEnvironment(): AIEnvironmentConfig {
    return {
      openaiApiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
      claudeApiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
      deepseekApiKey: process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY,
      defaultModel: process.env.DEFAULT_AI_MODEL || process.env.VITE_DEFAULT_AI_MODEL || 'claude-4-sonnet-thinking',
      defaultProvider: (process.env.DEFAULT_AI_PROVIDER || process.env.VITE_DEFAULT_AI_PROVIDER || 'claude') as AIProvider,
    };
  }

  public getApiKey(provider: AIProvider): string | undefined {
    switch (provider) {
      case 'openai':
        return this.config.openaiApiKey;
      case 'claude':
        return this.config.claudeApiKey;
      case 'gemini':
        return this.config.geminiApiKey;
      case 'deepseek':
        return this.config.deepseekApiKey;
      default:
        return undefined;
    }
  }

  public hasApiKey(provider: AIProvider): boolean {
    const key = this.getApiKey(provider);
    return !!key && key.length > 0;
  }

  public getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.hasApiKey('openai')) providers.push('openai');
    if (this.hasApiKey('claude')) providers.push('claude');
    if (this.hasApiKey('gemini')) providers.push('gemini');
    if (this.hasApiKey('deepseek')) providers.push('deepseek');
    return providers;
  }

  public getModelConfig(modelKey: string): AIModelConfig | undefined {
    return AI_MODELS[modelKey];
  }

  public getModelsByProvider(provider: AIProvider): AIModelConfig[] {
    return Object.values(AI_MODELS).filter(model => model.provider === provider);
  }

  public getDefaultModel(): string {
    return this.config.defaultModel || 'claude-4-sonnet-thinking';
  }

  public getDefaultProvider(): AIProvider {
    return this.config.defaultProvider || 'claude';
  }

  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      errors.push('No API keys found. Please set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY');
    }

    const defaultProvider = this.getDefaultProvider();
    if (!this.hasApiKey(defaultProvider)) {
      errors.push(`Default provider '${defaultProvider}' has no API key configured`);
    }

    const defaultModel = this.getDefaultModel();
    const modelConfig = this.getModelConfig(defaultModel);
    if (!modelConfig) {
      errors.push(`Default model '${defaultModel}' is not recognized`);
    } else if (!this.hasApiKey(modelConfig.provider)) {
      errors.push(`Default model '${defaultModel}' requires ${modelConfig.provider} API key which is not configured`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public printConfiguration(): void {
    console.log('🤖 AI Configuration Status:');
    console.log(`  Default Provider: ${this.getDefaultProvider()}`);
    console.log(`  Default Model: ${this.getDefaultModel()}`);
    console.log(`  Available Providers: ${this.getAvailableProviders().join(', ')}`);
    
    Object.entries({
      'OpenAI': this.hasApiKey('openai'),
      'Claude': this.hasApiKey('claude'),
      'Gemini': this.hasApiKey('gemini'),
      'Deepseek': this.hasApiKey('deepseek')
    }).forEach(([name, hasKey]) => {
      console.log(`  ${name}: ${hasKey ? '✅ Configured' : '❌ No API Key'}`);
    });

    const validation = this.validateConfiguration();
    if (!validation.valid) {
      console.log('⚠️  Configuration Issues:');
      validation.errors.forEach(error => console.log(`    - ${error}`));
    }
  }
}

// Singleton instance
export const aiConfig = new AIConfigManager(); 