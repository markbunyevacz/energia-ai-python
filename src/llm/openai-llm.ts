import { BaseLLM, LLMConfig, LLMResult } from './base-llm';
import OpenAI from 'openai';

export class OpenAILLM implements BaseLLM {
  public config: LLMConfig;
  private openai: OpenAI;

  constructor(config: LLMConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  async generate(prompt: string, options: any = {}): Promise<LLMResult> {
    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI.');
    }

    return {
      content,
      metadata: {
        usage: completion.usage,
      },
    };
  }
} 