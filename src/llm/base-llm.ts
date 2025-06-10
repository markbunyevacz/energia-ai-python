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