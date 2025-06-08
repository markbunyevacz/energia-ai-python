import { BaseAgent, AgentConfig, AgentContext, AgentResult } from '../base-agents/BaseAgent';
import { LegalDomain } from '../../legal-domains/types';
import type { Database } from '../../../integrations/supabase/types';

export class ExampleAgent extends BaseAgent {
  private processingCount: number = 0;

  constructor(config: AgentConfig) {
    super(config);
  }

  public async initialize(): Promise<void> {
    // Initialize any required resources
    this.processingCount = 0;
    console.log(`Initialized ${this.config.name} agent`);
  }

  public async process(context: AgentContext): Promise<AgentResult> {
    try {
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
        documentId: context.document.id,
      };

      return {
        success: true,
        message: `Successfully processed document ${context.document.id}`,
        data: result,
      };
    } catch (error) {
      return this.handleError(error as Error, context);
    }
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
      message: `Error processing document ${context.document.id}: ${error.message}`,
      error: error,
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