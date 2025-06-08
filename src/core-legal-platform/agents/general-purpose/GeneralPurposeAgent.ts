import { BaseAgent, AgentContext, AgentResult, AgentConfig } from '../base-agents/BaseAgent';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';

export const GENERAL_PURPOSE_AGENT_CONFIG: AgentConfig = {
    id: 'general-purpose-agent',
    name: 'General Purpose Agent',
    description: 'A general purpose agent for handling miscellaneous legal questions.',
    domainCode: 'general',
    enabled: true,
};

export class GeneralPurposeAgent extends BaseAgent {
  constructor(domainRegistry?: DomainRegistry) {
    super(GENERAL_PURPOSE_AGENT_CONFIG, domainRegistry);
  }

  public async initialize(): Promise<void> {
    // No special initialization needed for this simple agent
    return Promise.resolve();
  }

  public async process(context: AgentContext): Promise<AgentResult> {
    // For now, it returns a simple message.
    // In the future, this could call a general-purpose LLM.
    console.log('GeneralPurposeAgent processing:', context);
    
    return Promise.resolve({
      success: true,
      message: 'This is a general purpose response.',
      data: {
        summary: `A "${context.document.title}" című dokumentummal kapcsolatos általános kérdésre válaszolva...`,
        recommendations: ['Konzultáljon szakértővel a specifikus részletekért.'],
        risks: [],
      },
    });
  }
} 