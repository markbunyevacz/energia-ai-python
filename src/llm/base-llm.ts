/**
 * @fileoverview Base LLM Interface - Abstract Language Model Foundation
 * @description Abstract base class and interface definitions for Large Language Model
 * integrations in the Legal AI platform. Provides standardized interface for
 * different AI providers and ensures consistent behavior across implementations.
 * 
 * INTERFACE DESIGN:
 * - Standardized method signatures for all LLM operations
 * - Provider-agnostic implementation patterns
 * - Consistent error handling and response formats
 * - Extensible architecture for new AI providers
 * - Type-safe integration with TypeScript
 * 
 * CORE OPERATIONS:
 * - Text generation with configurable parameters
 * - Structured response formatting (JSON, XML, etc.)
 * - Streaming responses for real-time interactions
 * - Batch processing for multiple requests
 * - Context management and conversation handling
 * 
 * PROVIDER ABSTRACTION:
 * - Unified interface for OpenAI, Anthropic, local models
 * - Configuration management per provider
 * - Authentication and API key handling
 * - Rate limiting and quota management
 * - Error handling and retry mechanisms
 * 
 * EXTENSIBILITY:
 * - Plugin architecture for new AI providers
 * - Custom model implementations
 * - Middleware support for request/response processing
 * - Hook system for monitoring and analytics
 * 
 * INTEGRATION POINTS:
 * - AI Factory for model instantiation
 * - AI agents for specialized processing
 * - Configuration service for settings
 * - Monitoring and analytics systems
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */

export interface LLMConfig {
  apiKey: string;
  model: string;
}

export interface LLMResult {
  content: string;
  metadata?: Record<string, any>;
}

export interface BaseLLM {
  config: LLMConfig;
  generate(prompt: string, options?: any): Promise<LLMResult>;
} 
