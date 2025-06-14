import { BaseLLM, LLMConfig, LLMResult } from './base-llm';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'deepseek';

export interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIServiceResult extends LLMResult {
  provider: AIProvider;
  model: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIService implements BaseLLM {
  public config: LLMConfig;
  private openaiClient?: OpenAI;
  private claudeClient?: Anthropic;
  private geminiClient?: GoogleGenerativeAI;
  private deepseekApiKey?: string;
  private provider: AIProvider;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: AIServiceConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model
    };
    this.provider = config.provider;
    this.model = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4000;

    this.initializeClients(config);
  }

  private initializeClients(config: AIServiceConfig): void {
    switch (config.provider) {
      case 'openai':
        this.openaiClient = new OpenAI({
          apiKey: config.apiKey,
        });
        break;
      case 'claude':
        this.claudeClient = new Anthropic({
          apiKey: config.apiKey,
        });
        break;
      case 'gemini':
        this.geminiClient = new GoogleGenerativeAI(config.apiKey);
        break;
      case 'deepseek':
        this.deepseekApiKey = config.apiKey;
        break;
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  async generate(prompt: string, options: any = {}): Promise<LLMResult> {
    const result = await this.generateWithMetadata(prompt, options);
    return {
      content: result.content,
      metadata: result.metadata
    };
  }

  async generateWithMetadata(prompt: string, options: any = {}): Promise<AIServiceResult> {
    const temperature = options.temperature ?? this.temperature;
    const maxTokens = options.maxTokens ?? this.maxTokens;

    switch (this.provider) {
      case 'openai':
        return this.generateOpenAI(prompt, { temperature, maxTokens, ...options });
      case 'claude':
        return this.generateClaude(prompt, { temperature, maxTokens, ...options });
      case 'gemini':
        return this.generateGemini(prompt, { temperature, maxTokens, ...options });
      case 'deepseek':
        return this.generateDeepseek(prompt, { temperature, maxTokens, ...options });
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  private async generateOpenAI(prompt: string, options: any): Promise<AIServiceResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        ...options,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return {
        content,
        provider: 'openai',
        model: this.model,
        tokenUsage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
        metadata: {
          usage: completion.usage,
          finishReason: completion.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateClaude(prompt: string, options: any): Promise<AIServiceResult> {
    if (!this.claudeClient) {
      throw new Error('Claude client not initialized');
    }

    try {
      const response = await this.claudeClient.messages.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        ...options,
      });

      const content = response.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('No text content received from Claude');
      }

      return {
        content: content.text,
        provider: 'claude',
        model: this.model,
        tokenUsage: response.usage ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        } : undefined,
        metadata: {
          usage: response.usage,
          stopReason: response.stop_reason,
        },
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Claude API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateGemini(prompt: string, options: any): Promise<AIServiceResult> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const model = this.geminiClient.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No content received from Gemini');
      }

      return {
        content,
        provider: 'gemini',
        model: this.model,
        tokenUsage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
        metadata: {
          usage: response.usageMetadata,
          finishReason: response.candidates?.[0]?.finishReason,
        },
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateDeepseek(prompt: string, options: any): Promise<AIServiceResult> {
    if (!this.deepseekApiKey) {
      throw new Error('Deepseek API key not initialized');
    }

    try {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        ...options,
      }, {
        headers: {
          'Authorization': `Bearer ${this.deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from Deepseek');
      }

      return {
        content,
        provider: 'deepseek',
        model: this.model,
        tokenUsage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
        metadata: {
          usage: response.data.usage,
          finishReason: response.data.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      console.error('Deepseek API Error:', error);
      throw new Error(`Deepseek API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Static factory methods for creating services with latest models
  static createOpenAIService(apiKey: string, model: string = 'gpt-4o-mini-high'): AIService {
    return new AIService({
      provider: 'openai',
      apiKey,
      model,
      temperature: 0.1,
      maxTokens: 4000,
    });
  }

  static createClaudeService(apiKey: string, model: string = 'claude-4-sonnet-thinking'): AIService {
    return new AIService({
      provider: 'claude',
      apiKey,
      model,
      temperature: 0.1,
      maxTokens: 4000,
    });
  }

  static createGeminiService(apiKey: string, model: string = 'gemini-2.5-pro'): AIService {
    return new AIService({
      provider: 'gemini',
      apiKey,
      model,
      temperature: 0.1,
      maxTokens: 4000,
    });
  }

  // Utility method to test API connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generate('Hello, this is a connection test. Please respond with "OK".');
      return result.content.toLowerCase().includes('ok');
    } catch (error) {
      console.error(`Connection test failed for ${this.provider}:`, error);
      return false;
    }
  }
} 