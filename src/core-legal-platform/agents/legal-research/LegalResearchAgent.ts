import { BaseAgent, AgentConfig, AgentContext } from '@/core-legal-platform/agents/base-agents/BaseAgent';
import { AgentResponse, AgentTask } from '@/core-legal-platform/agents/types';
import { BaseLLM } from '@/llm/base-llm';
import { EmbeddingService } from '@/core-legal-platform/embedding/EmbeddingService';
import { vectorStoreService } from '@/core-legal-platform/vector-store/VectorStoreService';

// Define specific task and response types for this agent
export interface LegalResearchTask extends AgentTask {
  query: string;
  jurisdiction?: 'HU' | 'EU';
}

export interface LegalResearchResponse extends AgentResponse {
  findings: Array<{
    title: string;
    summary: string;
    source: string;
    relevance: number;
  }>;
}

interface VectorSearchDocument {
  title: string;
  content: string;
  metadata: {
    source: string;
    [key: string]: any;
  };
  similarity: number;
}

export class LegalResearchAgent extends BaseAgent<LegalResearchTask, LegalResearchResponse> {
  private embeddingService: EmbeddingService;

  constructor(config: AgentConfig, llm: BaseLLM) {
    super(
      config,
      undefined, // DomainRegistry will be initialized in BaseAgent
      llm,
      'You are a legal research assistant. Analyze the user query and provide relevant legal precedents and court decisions.',
      'Legal Research Agent',
      'An agent specialized in searching and summarizing legal documents, court decisions, and precedents.'
    );
    this.embeddingService = new EmbeddingService();
  }

  public async initialize(): Promise<void> {
    console.log(`[${this.config.name}] Initializing...`);
    // Initialization logic for this agent, e.g., connecting to legal databases
  }

  protected async performTask(task: LegalResearchTask, interactionId: string): Promise<LegalResearchResponse> {
    console.log(`[${this.config.name}] Performing legal research for query: "${task.query}"`);

    const queryEmbedding = await this.embeddingService.getEmbedding(task.query);

    const { data: documents, error } = await vectorStoreService.similaritySearch(queryEmbedding, 0.7, 10);

    if (error) {
      console.error(`[${this.config.name}] Error searching for documents:`, error);
      throw new Error(`Failed to perform similarity search: ${error.message}`);
    }

    const findings = (documents as VectorSearchDocument[] || []).map(doc => ({
      title: doc.title || 'No title',
      summary: doc.content ? doc.content.substring(0, 200) + '...' : 'No content',
      source: doc.metadata?.source || 'Unknown',
      relevance: doc.similarity || 0,
    }));

    return {
      findings,
    };
  }
} 