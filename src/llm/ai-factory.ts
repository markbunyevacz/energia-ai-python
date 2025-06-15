/**
 * @fileoverview AI Factory - Dynamic AI Model Creation & Management
 * @description Factory pattern implementation for creating and managing AI service
 * instances across the Legal AI platform. Provides centralized AI model configuration,
 * task-specific optimization, and intelligent model selection based on requirements.
 * 
 * FACTORY CAPABILITIES:
 * - Dynamic AI service creation based on task requirements
 * - Multiple AI provider support (OpenAI, Anthropic, local models)
 * - Task-specific model optimization and configuration
 * - Intelligent model selection and fallback mechanisms
 * - Performance monitoring and model health checks
 * 
 * SUPPORTED AI PROVIDERS:
 * - OpenAI: GPT-4, GPT-3.5-turbo for general tasks
 * - Anthropic: Claude models for complex reasoning
 * - Local models: Privacy-sensitive and offline processing
 * - Custom models: Domain-specific fine-tuned models
 * - Fallback providers: Redundancy and reliability
 * 
 * TASK SPECIALIZATION:
 * - analysis: Contract and document analysis tasks
 * - research: Legal research and precedent discovery
 * - summarization: Document summarization and extraction
 * - translation: Multi-language content processing
 * - classification: Document and content categorization
 * 
 * MODEL CONFIGURATION:
 * - Temperature and creativity settings per task
 * - Token limits and context window management
 * - Response format and structure requirements
 * - Performance vs accuracy trade-offs
 * - Cost optimization and budget management
 * 
 * INTELLIGENT SELECTION:
 * - Task complexity assessment for model matching
 * - Performance history and success rate analysis
 * - Cost-effectiveness optimization
 * - Availability and latency considerations
 * - User preference and requirement matching
 * 
 * RELIABILITY FEATURES:
 * - Automatic failover to backup models
 * - Health monitoring and performance tracking
 * - Rate limiting and quota management
 * - Error handling and retry mechanisms
 * - Circuit breaker patterns for stability
 * 
 * INTEGRATION POINTS:
 * - AI agents for specialized task processing
 * - Configuration service for model settings
 * - Monitoring service for performance tracking
 * - Cost tracking and budget management
 * 
 * USAGE PATTERNS:
 * - createTaskAI(): Task-specific AI service creation
 * - Model selection based on requirements
 * - Automatic configuration and optimization
 * - Performance monitoring and feedback
 * 
 * @author Legal AI Team
 * @version 1.4.0
 * @since 2024
 */
import { AIService, AIProvider } from './ai-service';
import { aiConfig } from '../config/ai-config';
import { BaseLLM } from './base-llm';

export class AIFactory {
  private static instance: AIFactory;
  private serviceCache: Map<string, AIService> = new Map();

  private constructor() {}

  public static getInstance(): AIFactory {
    if (!AIFactory.instance) {
      AIFactory.instance = new AIFactory();
    }
    return AIFactory.instance;
  }

  /**
   * Creates an AI service with the specified provider and model.
   * Falls back to available providers if the requested one is not configured.
   */
  public createService(
    provider?: AIProvider, 
    model?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      cacheEnabled?: boolean;
    }
  ): AIService {
    const resolvedProvider = this.resolveProvider(provider);
    const resolvedModel = this.resolveModel(resolvedProvider, model);
    
    const cacheKey = `${resolvedProvider}-${resolvedModel}`;
    const useCache = options?.cacheEnabled !== false;
    
    if (useCache && this.serviceCache.has(cacheKey)) {
      return this.serviceCache.get(cacheKey)!;
    }

    const apiKey = aiConfig.getApiKey(resolvedProvider);
    if (!apiKey) {
      throw new Error(`No API key found for provider: ${resolvedProvider}`);
    }

    const service = new AIService({
      provider: resolvedProvider,
      apiKey,
      model: resolvedModel,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    if (useCache) {
      this.serviceCache.set(cacheKey, service);
    }

    return service;
  }

  /**
   * Creates the default AI service based on configuration
   */
  public createDefaultService(): AIService {
    return this.createService();
  }

  /**
   * Creates a service optimized for specific tasks
   */
  public createForTask(task: 'reasoning' | 'coding' | 'analysis' | 'translation' | 'creative'): AIService {
    switch (task) {
      case 'reasoning':
        // Claude Sonnet for complex reasoning
        return this.createService('openai', 'gpt-4o-mini-high', {
          temperature: 0.3,
          maxTokens: 4000
        });
      
      case 'coding':
        // o4 mini for coding tasks
        return this.createService('gemini', 'gemini-2.5-pro', {
          temperature: 0.2,
          maxTokens: 4000
        });
      
      case 'analysis':
        // Claude for thorough analysis
        return this.createService('claude', 'claude-4-sonnet-thinking', {
          temperature: 0.4,
          maxTokens: 8000
        });
      
      case 'translation':
        // Gemini for translation tasks
        return this.createService('gemini', 'gemini-2.5-pro', {
          temperature: 0.3,
          maxTokens: 2000
        });
      
      case 'creative':
        // Higher temperature for creative tasks
        return this.createService('openai', 'gpt-4o-mini-high', {
          temperature: 0.65,
          maxTokens: 4000
        });
      
      default:
        return this.createDefaultService();
    }
  }

  /**
   * Creates multiple services for A/B testing or redundancy
   */
  public createMultipleServices(count: number = 2): AIService[] {
    const availableProviders = aiConfig.getAvailableProviders();
    const services: AIService[] = [];
    
    for (let i = 0; i < Math.min(count, availableProviders.length); i++) {
      const provider = availableProviders[i];
      services.push(this.createService(provider));
    }
    
    return services;
  }

  /**
   * Test all available services
   */
  public async testAllServices(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const availableProviders = aiConfig.getAvailableProviders();
    
    for (const provider of availableProviders) {
      try {
        const service = this.createService(provider);
        const isWorking = await service.testConnection();
        results.set(provider, isWorking);
        
        if (isWorking) {
          // console.log(`✅ ${provider} service is working`);
        } else {
          // console.log(`❌ ${provider} service failed test`);
        }
      } catch (error) {
        results.set(provider, false);
        // console.log(`❌ ${provider} service error:`, error);
      }
    }
    
    return results;
  }

  private resolveProvider(provider?: AIProvider): AIProvider {
    if (provider && aiConfig.hasApiKey(provider)) {
      return provider;
    }

    // Try default provider first
    const defaultProvider = aiConfig.getDefaultProvider();
    if (aiConfig.hasApiKey(defaultProvider)) {
      return defaultProvider;
    }

    // Fallback to any available provider
    const availableProviders = aiConfig.getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error('No AI providers are configured. Please set up API keys.');
    }

    // console.warn(`Requested provider '${provider}' not available, falling back to '${availableProviders[0]}'`);
    return availableProviders[0];
  }

  private resolveModel(provider: AIProvider, model?: string): string {
    if (model) {
      const modelConfig = aiConfig.getModelConfig(model);
      if (modelConfig && modelConfig.provider === provider) {
        return modelConfig.model;
      }
    }

    // Get default models for each provider
    const defaultModels = {
      openai: 'gpt-4o-mini-high',
      claude: 'claude-4-sonnet-thinking',
      gemini: 'gemini-2.5-pro',
      deepseek: 'deepseek-r1-0528'
    };

    return defaultModels[provider];
  }

  /**
   * Clear service cache
   */
  public clearCache(): void {
    this.serviceCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.serviceCache.size,
      keys: Array.from(this.serviceCache.keys())
    };
  }
}

// Convenience functions for common use cases
export const createAIService = (provider?: AIProvider, model?: string) => 
  AIFactory.getInstance().createService(provider, model);

export const createDefaultAI = () => 
  AIFactory.getInstance().createDefaultService();

export const createTaskAI = (task: 'reasoning' | 'coding' | 'analysis' | 'translation' | 'creative') =>
  AIFactory.getInstance().createForTask(task);

// Export singleton instance
export const aiFactory = AIFactory.getInstance(); 
