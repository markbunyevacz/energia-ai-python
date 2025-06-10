export interface LLMResponse {
  content: string;
}

export abstract class BaseLLM {
  protected apiKey: string;
  protected model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  abstract chat(prompt: string): Promise<LLMResponse>;
} 