import { BaseAgent, AgentConfig } from '../base-agents/BaseAgent';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { AgentTask, AgentResponse } from '../types';
import { BaseLLM } from '@/llm/base-llm';
import { OpenAILLM } from '@/llm/openai-llm';

export const GENERAL_PURPOSE_AGENT_CONFIG: AgentConfig = {
    id: 'general-purpose-agent',
    name: 'General Purpose Agent',
    description: 'A general purpose agent for handling miscellaneous legal questions.',
    domainCode: 'general',
    enabled: true,
};

export class GeneralPurposeAgent extends BaseAgent {
  constructor(domainRegistry?: DomainRegistry) {
    // For simplicity, we instantiate a default LLM here.
    // In a real application, this would be injected.
    const llm = new OpenAILLM(); 
    super(GENERAL_PURPOSE_AGENT_CONFIG, llm, "You are a helpful legal assistant.", "General Purpose Agent", "A general purpose agent for handling miscellaneous legal questions.", domainRegistry);
  }

  public async initialize(): Promise<void> {
    this.reason('Initializing GeneralPurposeAgent.');
    // No special initialization needed for this simple agent
    return Promise.resolve();
  }

  protected async performTask(task: AgentTask, interactionId: string): Promise<AgentResponse> {
    this.reason(`Starting task ${interactionId} for user query: "${task.query}"`);
    
    // For now, it returns a simple message.
    // In the future, this could call a general-purpose LLM.
    this.reason('This is a mock agent. No real LLM call will be made.');
    
    const responseData = {
        summary: `A "${task.context?.document?.title}" című dokumentummal kapcsolatos általános kérdésre válaszolva...`,
        recommendations: ['Konzultáljon szakértővel a specifikus részletekért.'],
        risks: [],
    };
    
    this.reason(`Generated summary and recommendations for document ID: ${task.context?.document?.id}`);

    return {
      success: true,
      data: responseData,
    };
  }
} 