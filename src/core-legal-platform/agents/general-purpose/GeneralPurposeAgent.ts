import { BaseAgent, AgentConfig } from '../base-agents/BaseAgent';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { AgentTask, AgentResponse } from '../types';
import { BaseLLM } from '@/llm/base-llm';
import { createTaskAI } from '@/llm/ai-factory';

export const GENERAL_PURPOSE_AGENT_CONFIG: AgentConfig = {
    id: 'general-purpose-agent',
    name: 'General Purpose Agent',
    description: 'A general purpose agent for handling miscellaneous legal questions.',
    domainCode: 'general',
    enabled: true,
};

export class GeneralPurposeAgent extends BaseAgent {
  constructor(domainRegistry?: DomainRegistry) {
    // Use the AI factory to create an optimized service for reasoning tasks
    const llm = createTaskAI('reasoning');
    super(GENERAL_PURPOSE_AGENT_CONFIG, llm, "You are a helpful legal assistant.", "General Purpose Agent", "A general purpose agent for handling miscellaneous legal questions.", domainRegistry);
  }

  public async initialize(): Promise<void> {
    this.reason('Initializing GeneralPurposeAgent.');
    // No special initialization needed for this simple agent
    return Promise.resolve();
  }

  protected async performTask(task: AgentTask, interactionId: string): Promise<AgentResponse> {
    this.reason(`Starting task ${interactionId} for user query: "${task.query}"`);
    
    // Call the LLM to get a response.
    const llmResponse = await this.llm.generate(task.query);
    
    const responseData = {
        summary: llmResponse,
        recommendations: ['Konzultáljon szakértővel a specifikus részletekért.'],
        risks: [],
    };
    
    this.reason(`Generated LLM response for query: "${task.query}"`);

    return {
      success: true,
      data: responseData,
    };
  }
} 