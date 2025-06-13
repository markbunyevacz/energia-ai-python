import { BaseAgent, AgentConfig, AgentContext, AgentResult, AgentTask, AgentResponse } from '../base-agents/BaseAgent';
import { LegalDomain } from '../../legal-domains/types';
import type { Database } from '../../../integrations/supabase/types';
import { BaseLLM } from '@/llm/base-llm';

export class ExampleAgent extends BaseAgent {
  private processingCount: number = 0;

  constructor(config: AgentConfig, llm: BaseLLM) {
    super(config, llm, "You are a helpful assistant.", "Example Agent", "An example agent.");
  }

  public async initialize(): Promise<void> {
    // Initialize any required resources
    this.processingCount = 0;
    console.log(`Initialized ${this.config.name} agent`);
  }

  protected async performTask(task: AgentTask): Promise<AgentResponse> {
      if (!this.isEnabled()) {
        throw new Error('Agent is disabled');
      }

      // Example processing logic
      this.processingCount++;
      const domain = await this.getDomain();

      if (!domain) {
        throw new Error(`Domain ${this.config.domainCode} not found`);
      }

      // Process the document based on domain rules
      const result = {
        processed: true,
        count: this.processingCount,
        domain: domain.code,
      documentId: task.context?.document?.id,
      };

      return {
        success: true,
      message: `Successfully processed document ${task.context?.document?.id}`,
        data: result,
      };
  }

  public async cleanup(): Promise<void> {
    // Clean up any resources
    this.processingCount = 0;
    console.log(`Cleaned up ${this.config.name} agent`);
  }

  public getProcessingCount(): number {
    return this.processingCount;
  }

  public handleError(error: Error, context: AgentContext): AgentResult {
    // Implement error handling logic
    return {
      success: false,
      data: null,
      error: `Error processing document ${context.document?.id}: ${error.message}`,
    };
  }
}

export class AgentSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentSecurityError';
  }
}

type DbLegalDocument = Database['public']['Tables']['legal_documents']['Row'];
type DbLegalDocumentInsert = Database['public']['Tables']['legal_documents']['Insert']; 